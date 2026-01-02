import {ComponentFixture, inject, TestBed, waitForAsync} from "@angular/core/testing";

import {SalaryCalculatorComponent} from "./salary-calculator.component";

describe("SalaryCalculatorComponent", () => {
    let component: SalaryCalculatorComponent;
    let fixture: ComponentFixture<SalaryCalculatorComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                SalaryCalculatorComponent,
            ],
        })
            .compileComponents();
    }));

    beforeEach(waitForAsync(() => {
        fixture = TestBed.createComponent(SalaryCalculatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", waitForAsync(inject([], () => {
        expect(component).toBeTruthy();
    })));
});
