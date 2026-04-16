import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { UsersService } from "./users.service";

@Controller("user")
export class UserController {
	constructor(private userService: UsersService) {}

	@UseGuards(AuthGuard)
	@Get("list")
	find() {
		return this.userService.getUsers();
	}

	@UseGuards(AuthGuard)
	@Get()
	findOne(@Request() req) {
		return this.userService.getUser({ id: req.user.id });
	}
}
