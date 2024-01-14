import {async, ComponentFixture, TestBed} from "@angular/core/testing";

import {SalaryCalculatorComponent} from "./salary-calculator.component";
import {HttpClientModule} from "@angular/common/http";

describe("SalaryCalculatorComponent", () => {
    let component: SalaryCalculatorComponent;
    let fixture: ComponentFixture<SalaryCalculatorComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                SalaryCalculatorComponent,
                HttpClientModule,
            ],
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
