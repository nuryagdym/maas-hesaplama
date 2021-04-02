import {async, ComponentFixture, TestBed} from "@angular/core/testing";

import {SalaryCalculatorComponent} from "./salary-calculator.component";
import {BrowserModule} from "@angular/platform-browser";
import {HttpClientModule} from "@angular/common/http";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgxCurrencyModule} from "ngx-currency";
import {FlexLayoutModule} from "@angular/flex-layout";
import {MatInputModule} from "@angular/material/input";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatTableModule} from "@angular/material/table";
import {MatSelectModule} from "@angular/material/select";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatTabsModule} from "@angular/material/tabs";

describe("SalaryCalculatorComponent", () => {
    let component: SalaryCalculatorComponent;
    let fixture: ComponentFixture<SalaryCalculatorComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SalaryCalculatorComponent],
            imports: [
                BrowserModule,
                HttpClientModule,
                CommonModule,
                FormsModule,
                NgxCurrencyModule,
                FlexLayoutModule,
                MatInputModule,
                BrowserAnimationsModule,
                MatTableModule,
                MatSelectModule,
                MatSlideToggleModule,
                MatTooltipModule,
                MatCardModule,
                MatIconModule,
                MatSnackBarModule,
                MatTabsModule,
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SalaryCalculatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
