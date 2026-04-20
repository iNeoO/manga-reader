import { Injectable } from "@nestjs/common";

type CounterKey = string;

type HistogramEntry = {
	buckets: number[];
	counts: number[];
	count: number;
	sum: number;
};

type RequestMetricInput = {
	durationMs?: number;
	method?: string;
	route?: string;
	statusClass?: string;
	statusCode?: number;
};

type ErrorMetricInput = {
	exceptionName?: string;
	method?: string;
	route?: string;
	statusCode?: number;
};

const HTTP_DURATION_BUCKETS_MS = [
	5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
];

@Injectable()
export class MetricsService {
	private readonly startedAt = process.hrtime.bigint();
	private readonly counters = new Map<CounterKey, number>();
	private readonly histograms = new Map<string, HistogramEntry>();

	observeHttpRequest(input: RequestMetricInput) {
		const route = normalizeRoute(input.route);
		if (shouldSkipRoute(route)) {
			return;
		}

		const method = normalizeLabel(input.method);
		const statusCode = String(input.statusCode ?? 0);
		const statusClass = normalizeLabel(input.statusClass);
		const durationMs = input.durationMs ?? 0;

		this.incrementCounter("manga_reader_http_requests_total", {
			method,
			route,
			status_class: statusClass,
			status_code: statusCode,
		});
		this.observeHistogram(
			"manga_reader_http_request_duration_ms",
			{
				method,
				route,
				status_class: statusClass,
			},
			durationMs,
			HTTP_DURATION_BUCKETS_MS,
		);
	}

	incrementHttpError(input: ErrorMetricInput) {
		const route = normalizeRoute(input.route);
		if (shouldSkipRoute(route)) {
			return;
		}

		this.incrementCounter("manga_reader_http_errors_total", {
			exception_name: normalizeLabel(input.exceptionName),
			method: normalizeLabel(input.method),
			route,
			status_code: String(input.statusCode ?? 0),
		});
	}

	renderPrometheusMetrics() {
		const lines: string[] = [];

		this.pushCounterFamily(
			lines,
			"manga_reader_http_requests_total",
			"Total HTTP requests handled by the backend.",
		);
		this.pushCounterFamily(
			lines,
			"manga_reader_http_errors_total",
			"Total HTTP request failures handled by the backend.",
		);
		this.pushHistogramFamily(
			lines,
			"manga_reader_http_request_duration_ms",
			"HTTP request duration in milliseconds.",
		);

		const memoryUsage = process.memoryUsage();
		const uptimeSeconds = Number(process.hrtime.bigint() - this.startedAt) / 1_000_000_000;

		lines.push("# HELP process_uptime_seconds Backend process uptime in seconds.");
		lines.push("# TYPE process_uptime_seconds gauge");
		lines.push(`process_uptime_seconds ${formatNumber(uptimeSeconds)}`);
		lines.push("# HELP process_resident_memory_bytes Backend resident memory size in bytes.");
		lines.push("# TYPE process_resident_memory_bytes gauge");
		lines.push(`process_resident_memory_bytes ${memoryUsage.rss}`);
		lines.push("# HELP process_heap_used_bytes Backend heap used in bytes.");
		lines.push("# TYPE process_heap_used_bytes gauge");
		lines.push(`process_heap_used_bytes ${memoryUsage.heapUsed}`);
		lines.push("# HELP process_heap_total_bytes Backend heap total in bytes.");
		lines.push("# TYPE process_heap_total_bytes gauge");
		lines.push(`process_heap_total_bytes ${memoryUsage.heapTotal}`);

		return `${lines.join("\n")}\n`;
	}

	private incrementCounter(name: string, labels: Record<string, string>, value = 1) {
		const key = buildMetricKey(name, labels);
		this.counters.set(key, (this.counters.get(key) ?? 0) + value);
	}

	private observeHistogram(
		name: string,
		labels: Record<string, string>,
		value: number,
		buckets: number[],
	) {
		const key = buildMetricKey(name, labels);
		const existing = this.histograms.get(key) ?? {
			buckets,
			counts: buckets.map(() => 0),
			count: 0,
			sum: 0,
		};

		existing.count += 1;
		existing.sum += value;
		for (const [index, bucket] of existing.buckets.entries()) {
			if (value <= bucket) {
				existing.counts[index] += 1;
			}
		}

		this.histograms.set(key, existing);
	}

	private pushCounterFamily(lines: string[], name: string, help: string) {
		lines.push(`# HELP ${name} ${help}`);
		lines.push(`# TYPE ${name} counter`);

		for (const [key, value] of this.counters.entries()) {
			if (!key.startsWith(`${name}{`)) {
				continue;
			}

			lines.push(`${key} ${formatNumber(value)}`);
		}
	}

	private pushHistogramFamily(lines: string[], name: string, help: string) {
		lines.push(`# HELP ${name} ${help}`);
		lines.push(`# TYPE ${name} histogram`);

		for (const [key, entry] of this.histograms.entries()) {
			if (!key.startsWith(`${name}{`)) {
				continue;
			}

			const labels = parseMetricKeyLabels(key);
			for (const [index, bucket] of entry.buckets.entries()) {
				lines.push(
					`${name}_bucket${formatLabels({ ...labels, le: String(bucket) })} ${entry.counts[index]}`,
				);
			}
			lines.push(
				`${name}_bucket${formatLabels({ ...labels, le: "+Inf" })} ${entry.count}`,
			);
			lines.push(`${name}_sum${formatLabels(labels)} ${formatNumber(entry.sum)}`);
			lines.push(`${name}_count${formatLabels(labels)} ${entry.count}`);
		}
	}
}

function shouldSkipRoute(route: string) {
	return route === "/metrics";
}

function normalizeRoute(route?: string) {
	if (!route) {
		return "unknown";
	}

	return route.startsWith("/") ? route : `/${route}`;
}

function normalizeLabel(value?: string) {
	return value && value.length > 0 ? value : "unknown";
}

function buildMetricKey(name: string, labels: Record<string, string>) {
	return `${name}${formatLabels(labels)}`;
}

function formatLabels(labels: Record<string, string>) {
	const entries = Object.entries(labels).sort(([left], [right]) =>
		left.localeCompare(right),
	);
	if (entries.length === 0) {
		return "";
	}

	const formatted = entries
		.map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
		.join(",");

	return `{${formatted}}`;
}

function parseMetricKeyLabels(metricKey: string) {
	const match = metricKey.match(/\{(.*)\}$/);
	if (!match) {
		return {};
	}

	return match[1]
		.split(",")
		.filter(Boolean)
		.reduce<Record<string, string>>((accumulator, pair) => {
			const separatorIndex = pair.indexOf("=");
			const key = pair.slice(0, separatorIndex);
			const rawValue = pair.slice(separatorIndex + 1).replace(/^"|"$/g, "");
			accumulator[key] = unescapeLabelValue(rawValue);
			return accumulator;
		}, {});
}

function escapeLabelValue(value: string) {
	return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function unescapeLabelValue(value: string) {
	return value.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

function formatNumber(value: number) {
	return Number.isFinite(value) ? value.toFixed(6).replace(/\.?0+$/, "") : "0";
}
