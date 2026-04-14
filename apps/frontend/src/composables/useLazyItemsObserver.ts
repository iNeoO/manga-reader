import { onBeforeUnmount, ref } from "vue";

export const useLazyItemsObserver = () => {
	const items = ref<Element | null>(null);

	let intersectionObserver: IntersectionObserver | undefined;
	let mutationObserver: MutationObserver | undefined;
	let debouncedFunctionTimeout: number | undefined;

	const setObserver = () => {
		if (!items.value) {
			return;
		}

		const config = {
			rootMargin: "0px 0px 50px 0px",
			threshold: 0,
		};

		intersectionObserver?.disconnect();
		intersectionObserver = new IntersectionObserver((entries, self) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const src = entry.target.getAttribute("data-src");
					entry.target.setAttribute("src", `${src}`);
					self.unobserve(entry.target);
				}
			});
		}, config);

		const imgs = items.value.querySelectorAll("[data-src]");
		imgs.forEach((img) => {
			intersectionObserver?.observe(img);
		});
	};

	const refreshObserver = () => {
		if (debouncedFunctionTimeout !== undefined) {
			window.clearTimeout(debouncedFunctionTimeout);
		}

		debouncedFunctionTimeout = window.setTimeout(() => {
			setObserver();
		}, 300);
	};

	const observeMutations = () => {
		if (!items.value) {
			return;
		}

		mutationObserver?.disconnect();
		mutationObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === "childList") {
					refreshObserver();
				}
			});
		});
		mutationObserver.observe(items.value, { childList: true });
		refreshObserver();
	};

	onBeforeUnmount(() => {
		intersectionObserver?.disconnect();
		mutationObserver?.disconnect();
		if (debouncedFunctionTimeout !== undefined) {
			window.clearTimeout(debouncedFunctionTimeout);
		}
	});

	return {
		items,
		observeMutations,
		refreshObserver,
	};
};
