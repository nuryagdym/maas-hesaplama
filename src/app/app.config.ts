import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withFetch} from "@angular/common/http";
import localeTR from "@angular/common/locales/tr";
import {registerLocaleData} from "@angular/common";

registerLocaleData(localeTR, "tr");

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withFetch()),
    ]
};
