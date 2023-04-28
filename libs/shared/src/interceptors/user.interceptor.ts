import {
	CallHandler,
	ExecutionContext,
	Inject,
	Injectable,
	NestInterceptor
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Observable, catchError, switchMap } from "rxjs";

import { extractTokenFromHeaders } from "../helpers";
import { UserAccessToken, UserRequest } from "../interfaces";

@Injectable()
export class UserInterceptor implements NestInterceptor {
	constructor(@Inject("AUTH_SERVICE") private readonly authService: ClientProxy) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		// Skips not HTTP requests. Nothing would be attached.
		if (context.getType() !== "http") return next.handle();

		const request: UserRequest = context.switchToHttp().getRequest();
		const token = extractTokenFromHeaders(request.headers);

		if (!token) return next.handle();

		return this.authService
			.send<UserAccessToken>({ cmd: "decode-access-token" }, { token })
			.pipe(
				switchMap(decodedToken => {
					request.user = decodedToken.user;
					return next.handle();
				}),
				catchError(() => next.handle())
			);
	}
}
