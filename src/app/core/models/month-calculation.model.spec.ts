import {MonthCalculationModel} from "./month-calculation.model";
import {YearCalculationModel} from "./year-calculation.model";
import * as parameters from "src/assets/fixtures.json";
import {yearParameters} from "src/assets/year-parameters.json";

describe("MonthCalculationModel", () => {
    const AGIOptions = parameters.AGI_OPTIONS;
    const employeeTypes = parameters.EMPLOYEE_TYPES;
    const disabilityOptions = parameters.DISABILITY_OPTIONS;
    const employeeEducationTypes = parameters.EMPLOYEE_EDUCATION_TYPES;
    const calcModes = YearCalculationModel.calculationModes;

    it("calculate month for year 2021, from GROSS_TO_NET, 30 days, 30 r&d days, gross salary 10000 TL, AGI Bekar, Engelli degil, Standart calisan, Emekli Degil", () => {
        const salary = 10000;
        const workedDays = 30;
        const researchAndDevelopmentWorkedDays = 30;

        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParameters[0], salary, workedDays, researchAndDevelopmentWorkedDays,
            AGIOptions.options[0].rate,
            employeeTypes.options[0], employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);
        expect(month.calculatedGrossSalary).toEqual(salary);
        expect(month.stampTax).toEqual(75.9);
        expect(roundNumber(month.employeeSGKDeduction)).toEqual(1400);
        expect(month.employeeUnemploymentInsuranceDeduction).toEqual(100);
        expect(month.appliedTaxSlices.length).toEqual(1);
        expect(roundNumber(month.netSalary)).toEqual(7149.1);
        expect(roundNumber(month.employerAGIAmount)).toEqual(268.31);
        expect(roundNumber(month.finalNetSalary)).toEqual(	7417.41);

        expect(month.employerSGKDeduction).toEqual(	2050);
        expect(month.employerUnemploymentInsuranceDeduction).toEqual(	200);
        expect(month.employerTotalSGKCost).toEqual(	3750);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(	1006.69);
        expect(roundNumber(month.employerTotalCost)).toEqual(	12250);
    });

    const roundNumber = (num: number, precision = 2) => {
        return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
    };
});
