import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AdalService } from "adal-angular4";
import {DiagnosticApiService} from '../services/diagnostic-api.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

const loginRedirectKey = 'login_redirect';

@Injectable()
export class AadAuthGuard implements CanActivate {
    isAuthorized: Boolean = false;

    constructor(private _router: Router, private _adalService: AdalService, private _diagnosticApiService: DiagnosticApiService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
        this._adalService.handleWindowCallback();

        if (!this._adalService.userInfo.authenticated) {
            if (state.url.indexOf('#') === -1) {
                localStorage.setItem(loginRedirectKey, state.url);
                this._router.navigate(['login'])
            }
        }
        else {
            this.clearHash();
            var returnUrl = localStorage.getItem(loginRedirectKey);
            if (returnUrl && returnUrl != '') {
                this._router.navigateByUrl(returnUrl);
                localStorage.removeItem(loginRedirectKey);
            }
            if (this.isAuthorized){
                return true;
            }
            return this._diagnosticApiService.get("api/ping", true).map(res => 
                {
                    this.isAuthorized = true;
                    return true;
                })
                .catch(err => 
                {
                    this.isAuthorized = false;
                    if (err.status == 403)
                    {
                        this._router.navigate(['unauthorized']);
                    }
                    else if (err.status == 401){
                        this._router.navigate(['tokeninvalid']);
                    }
                    else {
                        this._router.navigate(['authRequestFailed']);
                    }
                    return Observable.throw(false);
                });
        }
    }

    clearHash() {
        if (window.location.hash) {
            if (window.history.replaceState) {
                window.history.replaceState('', '/', window.location.pathname)
            } else {
                window.location.hash = '';
            }
        }
    }
}
