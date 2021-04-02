import {TestBed, async} from "@angular/core/testing";
import {AppComponent} from "./app.component";
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
import {SalaryCalculatorComponent} from "./components/salary-calculator/salary-calculator.component";
import {SalaryComparatorComponent} from "./components/salary-comparator/salary-comparator.component";
import {MatTabsModule} from "@angular/material/tabs";

describe("AppComponent", () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
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
            ],
            declarations: [
                AppComponent,
                SalaryCalculatorComponent,
                SalaryComparatorComponent,
            ],
        }).compileComponents();
    }));

    it("should create the app", () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });
});
