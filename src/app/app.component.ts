import {Component, OnInit} from "@angular/core";
import {
    ParametersService,
} from "./core/services/parameters.service";

import {MatSnackBar} from "@angular/material/snack-bar";
@Component({
    selector: "salary-app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {

    loading = false;


    constructor(private parametersService: ParametersService, private _snackBar: MatSnackBar) {

    }

    ngOnInit() {

        this.loading = true;
    }
}
