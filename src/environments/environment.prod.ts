import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {HttpMockRequestInterceptor} from "../app/core/interceptors/mock.interceptor";

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: true,
    baseURL: "/maas-hesaplama/"
};
