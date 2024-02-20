import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Observable, catchError, of, switchMap } from "rxjs";

import { extractTokenFromHeaders } from "@app/shared/helpers";

import { UserAccessToken, UserRequest } from "../interfaces";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(@Inject("AUTH_SERVICE") private authService: ClientProxy) {}

	canActivate(
		context: ExecutionContext
	): boolean | Promise<boolean> | Observable<boolean> {
		// No need to do all of the validation work while request going between microservices.
		if (context.getType() === "rpc") {
			return true;
		}

		const request: UserRequest = context.switchToHttp().getRequest();
		const token = extractTokenFromHeaders(request.headers);

		if (!token) {
			throw new UnauthorizedException();
		}

		return this.authService
			.send<UserAccessToken, string>({ cmd: "verify-access-token" }, token)
			.pipe(
				switchMap(() => {
					return of(true);
				}),
				catchError(() => {
					throw new UnauthorizedException();
				})
			);
	}
}
