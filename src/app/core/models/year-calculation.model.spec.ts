import {YearCalculationModel} from "./year-calculation.model";
import {ParametersService} from "../services/parameters.service";
import {TestBed, async} from "@angular/core/testing";
import {HttpClient, HttpHandler} from "@angular/common/http";
const parameters = require("src/assets/fixtures.json");
const yearParameters = require("src/assets/year-parameters.json").yearParameters;

describe("YearCalculationModel", () => {
    let yearCalculationModel: YearCalculationModel;
    const AGIOptions = parameters.AGI_OPTIONS;
    const employeeTypes = parameters.EMPLOYEE_TYPES;
    const standardEmployeeType = employeeTypes.options.find((o) => o.id === 1);
    const disabilityOptions = parameters.DISABILITY_OPTIONS;
    const employeeEducationTypes = parameters.EMPLOYEE_EDUCATION_TYPES;
    const calcModes = YearCalculationModel.calculationModes;
    const months = parameters.MONTHS;
    const monthSalaryInputs = new Array(months.length);
    const dayCounts = new Array(months.length);
    const researchAndDevelopmentDayCounts = new Array(months.length);

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            providers: [ParametersService, HttpClient, HttpHandler],
        });
        yearCalculationModel = new YearCalculationModel(months, parameters.CALCULATION_CONSTANTS, standardEmployeeType);
    }));

    it("should create an instance", () => {
        expect(yearCalculationModel).toBeTruthy();
    });

    it("2021, 30 gun, Gross to Net, AGI Bekar, Standart Calisan, entered amount 10000, 30 days, No Disability", () => {
        const selectedYear = yearParameters.find((y) => y.year === 2021);
        const grossSalary = 10000;
        monthSalaryInputs.fill(grossSalary);
        dayCounts.fill(yearCalculationModel.monthDayCount);
        researchAndDevelopmentDayCounts.fill(yearCalculationModel.monthDayCount);
        yearCalculationModel.year = selectedYear;
        yearCalculationModel.calculationMode = calcModes.options[0].id;
        yearCalculationModel.AGI = AGIOptions.options[0];
        yearCalculationModel.employeeType = employeeTypes.options[0];
        yearCalculationModel.employeeEduType = employeeEducationTypes.options[0];
        yearCalculationModel.employerDiscount5746 = false;
        yearCalculationModel.enteredAmounts = [...monthSalaryInputs];
        yearCalculationModel.dayCounts = [...dayCounts];
        yearCalculationModel.researchAndDevelopmentWorkedDays = [...researchAndDevelopmentDayCounts];
        yearCalculationModel.isAGIIncludedTax = false;

        yearCalculationModel.isPensioner = false;
        yearCalculationModel.employeeDisability = disabilityOptions.options[0].degree;

        yearCalculationModel.calculate();
        expect(yearCalculationModel.calculatedGrossSalary).toEqual(grossSalary * monthSalaryInputs.length);
        expect(roundNumber(yearCalculationModel.stampTax)).toEqual(910.80);
        expect(roundNumber(yearCalculationModel.employeeSGKDeduction)).toEqual(16800);
        expect(roundNumber(yearCalculationModel.employeeUnemploymentInsuranceDeduction)).toEqual(1200);
        expect(roundNumber(yearCalculationModel.employeeIncomeTax)).toEqual(22630);
        expect(roundNumber(yearCalculationModel.netSalary)).toEqual(78459.20);
        expect(roundNumber(yearCalculationModel.finalNetSalary)).toEqual(81678.95);
        expect(roundNumber(yearCalculationModel.employerSGKDeduction)).toEqual(24600);
        expect(roundNumber(yearCalculationModel.employerUnemploymentInsuranceDeduction)).toEqual(2400);
        expect(roundNumber(yearCalculationModel.employerTotalSGKCost)).toEqual(45000);
        expect(roundNumber(yearCalculationModel.employerStampTax)).toEqual(910.80);
        expect(roundNumber(yearCalculationModel.employerFinalIncomeTax)).toEqual(19410.25);
        expect(roundNumber(yearCalculationModel.employerTotalCost)).toEqual(147000);

    });

    it("2022, 30 gun, Gross to Net, AGI Bekar, Standart Calisan, entered amount 10000, 30 days, No Disability. son 7 ay hesaplam", () => {
        const selectedYear = yearParameters.find((y) => y.year === 2022);
        const grossSalary = 10000;
        monthSalaryInputs.fill(0., 0, 5);
        monthSalaryInputs.fill(grossSalary, 5);
        dayCounts.fill(yearCalculationModel.monthDayCount);
        researchAndDevelopmentDayCounts.fill(yearCalculationModel.monthDayCount);
        yearCalculationModel.year = selectedYear;
        yearCalculationModel.calculationMode = calcModes.options[0].id;
        yearCalculationModel.AGI = AGIOptions.options[0];
        yearCalculationModel.employeeType = employeeTypes.options[0];
        yearCalculationModel.employeeEduType = employeeEducationTypes.options[0];
        yearCalculationModel.employerDiscount5746 = false;
        yearCalculationModel.enteredAmounts = [...monthSalaryInputs];
        yearCalculationModel.dayCounts = [...dayCounts];
        yearCalculationModel.researchAndDevelopmentWorkedDays = [...researchAndDevelopmentDayCounts];
        yearCalculationModel.isAGIIncludedTax = false;

        yearCalculationModel.isPensioner = false;
        yearCalculationModel.applyMinWageTaxExemption = true;
        yearCalculationModel.employeeDisability = disabilityOptions.options[0].degree;

        yearCalculationModel.calculate();
        expect(yearCalculationModel.calculatedGrossSalary).toEqual(70000);
        expect(roundNumber(yearCalculationModel.stampTax)).toEqual(531.30);
        expect(roundNumber(yearCalculationModel.employeeSGKDeduction)).toEqual(9800);
        expect(roundNumber(yearCalculationModel.employeeUnemploymentInsuranceDeduction)).toEqual(700);
        expect(roundNumber(yearCalculationModel.employeeIncomeTax)).toEqual(10300);
        expect(roundNumber(yearCalculationModel.netSalary)).toEqual( 54852.47);
        expect(roundNumber(yearCalculationModel.finalNetSalary)).toEqual( 54852.47);
        expect(roundNumber(yearCalculationModel.employerSGKDeduction)).toEqual(14350);
        expect(roundNumber(yearCalculationModel.employerUnemploymentInsuranceDeduction)).toEqual(1400);
        expect(roundNumber(yearCalculationModel.employerTotalSGKCost)).toEqual(26250);
        expect(roundNumber(yearCalculationModel.employeeMinWageTaxExemptionAmount)).toEqual(6183.77);
        expect(roundNumber(yearCalculationModel.employerStampTax)).toEqual(198.63);
        expect(roundNumber(yearCalculationModel.employerFinalIncomeTax)).toEqual(4448.9);
        expect(roundNumber(yearCalculationModel.employerTotalCost)).toEqual(85750);
    });

    const roundNumber = (num: number, precision = 2) => {
        return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
    };
});
