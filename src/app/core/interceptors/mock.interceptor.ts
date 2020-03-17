import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import * as parameters from '../../../assets/year-parameters.json';
import * as fixtures from '../../../assets/fixtures.json';

const urls = [
    {
        url: 'http://localhost:3000/assets/year-parameters.json',
        json: parameters
    },
    {
        url: 'http://localhost:3000/assets/fixtures.json',
        json: fixtures
    }
];

@Injectable()
export class HttpMockRequestInterceptor implements HttpInterceptor {
    constructor(private injector: Injector) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {  
        for (const element of urls) {
            if (request.url === element.url) {
                return of(new HttpResponse({ status: 200, body: ((element.json) as any).default }));
            }
        }
        return next.handle(request);
    }
}