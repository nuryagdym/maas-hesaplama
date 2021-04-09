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
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const employeeType = employeeTypes.options.find((o) => o.id === 1);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, researchAndDevelopmentWorkedDays,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);
        expect(month.calculatedGrossSalary).toEqual(salary);
        expect(month.stampTax).toEqual(75.9);
        expect(roundNumber(month.employeeSGKDeduction)).toEqual(1400);
        expect(month.employeeUnemploymentInsuranceDeduction).toEqual(100);
        expect(month.appliedTaxSlices.length).toEqual(1);
        expect(roundNumber(month.netSalary)).toEqual(7149.1);
        expect(roundNumber(month.AGIAmount)).toEqual(268.31);
        expect(roundNumber(month.finalNetSalary)).toEqual(7417.41);

        expect(month.employerSGKDeduction).toEqual(2050);
        expect(month.employerUnemploymentInsuranceDeduction).toEqual(200);
        expect(month.employerTotalSGKCost).toEqual(3750);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(1006.69);
        expect(roundNumber(month.employerTotalCost)).toEqual(12250);
    });


    it("calculate month for year 2021, from GROSS_TO_NET, 30 days, gross salary 10000 TL, AGI Bekar, Engelli degil, 27103 Personel, Emekli Degil", () => {
        const salary = 10000;
        const workedDays = 30;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const employeeType = employeeTypes.options.find((o) => o.id === 6);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, 0,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);
        expect(roundNumber(month.calculatedGrossSalary)).toEqual(salary);
        expect(roundNumber(month.stampTax)).toEqual(75.9);
        expect(roundNumber(month.employerStampTaxExemption)).toEqual(27.15);

        expect(roundNumber(month.employeeSGKDeduction)).toEqual(1400);
        expect(roundNumber(month.employeeSGKExemption)).toEqual(500.85);
        expect(roundNumber(month.employeeFinalSGKDeduction)).toEqual(899.15);

        expect(roundNumber(month.employeeUnemploymentInsuranceDeduction)).toEqual(100);
        expect(roundNumber(month.employeeUnemploymentInsuranceExemption)).toEqual(35.78);
        expect(roundNumber(month.employeeFinalUnemploymentInsuranceDeduction)).toEqual(64.22);

        expect(roundNumber(month.finalNetSalary)).toEqual(7417.41);

        expect(roundNumber(month.employerSGKDeduction)).toEqual(2050);
        expect(roundNumber(month.employerSGKExemption)).toEqual(733.39);

        expect(roundNumber(month.employerUnemploymentInsuranceDeduction)).toEqual(200);
        expect(roundNumber(month.employerUnemploymentInsuranceExemption)).toEqual(71.55);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(2408.44);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(818.87);
        expect(roundNumber(month.employerTotalCost)).toEqual(10693.47);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 20 days, gross salary 10000 TL, AGI Bekar, Engelli degil, 27103 Personel, Emekli Degil", () => {
        const salary = 10000;
        const workedDays = 20;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const employeeType = employeeTypes.options.find((o) => o.id === 6);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, 0,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.stampTax)).toEqual(50.6);
        expect(roundNumber(month.employerStampTaxExemption)).toEqual(18.1);

        expect(roundNumber(month.employeeSGKDeduction)).toEqual(933.33);
        expect(roundNumber(month.employeeSGKExemption)).toEqual(333.9);
        expect(roundNumber(month.employeeFinalSGKDeduction)).toEqual(599.43);

        expect(roundNumber(month.employeeUnemploymentInsuranceDeduction)).toEqual(66.67);
        expect(roundNumber(month.employeeUnemploymentInsuranceExemption)).toEqual(23.85);
        expect(roundNumber(month.employeeFinalUnemploymentInsuranceDeduction)).toEqual(42.82);

        expect(roundNumber(month.netSalary)).toEqual(4766.07);
        expect(roundNumber(month.finalNetSalary)).toEqual(5034.38);

        expect(roundNumber(month.employerSGKDeduction)).toEqual(1366.67);
        expect(roundNumber(month.employerSGKExemption)).toEqual(488.92);
        expect(roundNumber(month.employerFinalSGKDeduction)).toEqual(877.74);

        expect(roundNumber(month.employerUnemploymentInsuranceDeduction)).toEqual(133.33);
        expect(roundNumber(month.employerUnemploymentInsuranceExemption)).toEqual(47.7);
        expect(roundNumber(month.employerFinalUnemploymentInsuranceDeduction)).toEqual(85.63);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(1605.63);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(545.91);
        expect(roundNumber(month.employerTotalCost)).toEqual(7218.41);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 30 days, gross salary Min Wage, AGI Bekar, Engelli degil, 27103 Personel, Emekli Degil", () => {

        const workedDays = 30;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const salary = yearParams.minGrossWage;
        const employeeType = employeeTypes.options.find((o) => o.id === 6);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, 0,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.stampTax)).toEqual(27.15);
        expect(roundNumber(month.employerStampTaxExemption)).toEqual(27.15);

        expect(roundNumber(month.employeeSGKDeduction)).toEqual(500.85);
        expect(roundNumber(month.employeeSGKExemption)).toEqual(500.85);
        expect(roundNumber(month.employeeFinalSGKDeduction)).toEqual(0);

        expect(roundNumber(month.employeeUnemploymentInsuranceDeduction)).toEqual(35.78);
        expect(roundNumber(month.employeeUnemploymentInsuranceExemption)).toEqual(35.78);
        expect(roundNumber(month.employeeFinalUnemploymentInsuranceDeduction)).toEqual(0);

        expect(roundNumber(month.netSalary)).toEqual(2557.59);
        expect(roundNumber(month.finalNetSalary)).toEqual(2825.9);

        expect(roundNumber(month.employerSGKDeduction)).toEqual(733.39);
        expect(roundNumber(month.employerSGKExemption)).toEqual(733.39);
        expect(roundNumber(month.employerFinalSGKDeduction)).toEqual(0);

        expect(roundNumber(month.employerUnemploymentInsuranceDeduction)).toEqual(71.55);
        expect(roundNumber(month.employerUnemploymentInsuranceExemption)).toEqual(71.55);
        expect(roundNumber(month.employerFinalUnemploymentInsuranceDeduction)).toEqual(0);


        expect(roundNumber(month.employerTotalSGKCost)).toEqual(0);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(0);
        expect(roundNumber(month.employerTotalCost)).toEqual(2825.9);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 10 days, gross salary 20000 TL, AGI Bekar, Engelli degil, 27103 Personel, Emekli Degil", () => {
        const salary = 20000;
        const workedDays = 10;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const employeeType = employeeTypes.options.find((o) => o.id === 6);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, 0,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(2052.81);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(581.69);
        expect(roundNumber(month.employerTotalCost)).toEqual(7710.43);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 30 days, gross salary 10000 TL, AGI Bekar, Engelli degil, 17103 Personel, Emekli Degil", () => {
        const salary = 10000;
        const workedDays = 30;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const employeeType = employeeTypes.options.find((o) => o.id === 7);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, 0,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.stampTax)).toEqual(75.9);
        expect(roundNumber(month.employerStampTaxExemption)).toEqual(27.15);

        expect(roundNumber(month.employeeSGKDeduction)).toEqual(1400);
        expect(roundNumber(month.employeeSGKExemption)).toEqual(1335.6);
        expect(roundNumber(month.employeeFinalSGKDeduction)).toEqual(64.4);

        expect(roundNumber(month.employeeUnemploymentInsuranceDeduction)).toEqual(100);
        expect(roundNumber(month.employeeUnemploymentInsuranceExemption)).toEqual(95.4);
        expect(roundNumber(month.employeeFinalUnemploymentInsuranceDeduction)).toEqual(4.6);

        expect(roundNumber(month.netSalary)).toEqual(7149.1);
        expect(roundNumber(month.finalNetSalary)).toEqual(7417.41);

        expect(roundNumber(month.employerSGKDeduction)).toEqual(2050);
        expect(roundNumber(month.employerSGKExemption)).toEqual(1955.7);
        expect(roundNumber(month.employerFinalSGKDeduction)).toEqual(94.3);

        expect(roundNumber(month.employerUnemploymentInsuranceDeduction)).toEqual(200);
        expect(roundNumber(month.employerUnemploymentInsuranceExemption)).toEqual(190.8);
        expect(roundNumber(month.employerFinalUnemploymentInsuranceDeduction)).toEqual(9.2);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(172.5);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(818.87);
        expect(roundNumber(month.employerTotalCost)).toEqual(8457.53);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 20 days, gross salary 10000 TL, AGI Bekar, Engelli degil, 17103 Personel, Emekli Degil", () => {
        const salary = 10000;
        const workedDays = 20;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const employeeType = employeeTypes.options.find((o) => o.id === 7);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, 0,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.stampTax)).toEqual(50.6);
        expect(roundNumber(month.employerStampTaxExemption)).toEqual(18.1);

        expect(roundNumber(month.employeeSGKDeduction)).toEqual(933.33);
        expect(roundNumber(month.employeeSGKExemption)).toEqual(890.4);
        expect(roundNumber(month.employeeFinalSGKDeduction)).toEqual(42.93);

        expect(roundNumber(month.employeeUnemploymentInsuranceDeduction)).toEqual(66.67);
        expect(roundNumber(month.employeeUnemploymentInsuranceExemption)).toEqual(63.60);
        expect(roundNumber(month.employeeFinalUnemploymentInsuranceDeduction)).toEqual(3.07);

        expect(roundNumber(month.netSalary)).toEqual(4766.07);
        expect(roundNumber(month.finalNetSalary)).toEqual(5034.38);

        expect(roundNumber(month.employerSGKDeduction)).toEqual(1366.67);
        expect(roundNumber(month.employerSGKExemption)).toEqual(1303.8);
        expect(roundNumber(month.employerFinalSGKDeduction)).toEqual(62.87);

        expect(roundNumber(month.employerUnemploymentInsuranceDeduction)).toEqual(133.33);
        expect(roundNumber(month.employerUnemploymentInsuranceExemption)).toEqual(127.20);
        expect(roundNumber(month.employerFinalUnemploymentInsuranceDeduction)).toEqual(6.13);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(115);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(545.91);
        expect(roundNumber(month.employerTotalCost)).toEqual(5727.79);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 30 days, gross salary Min Wage, AGI Bekar, Engelli degil, 17103 Personel, Emekli Degil", () => {

        const workedDays = 30;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const salary = yearParams.minGrossWage;
        const employeeType = employeeTypes.options.find((o) => o.id === 7);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, 0,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            false, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.stampTax)).toEqual(27.15);
        expect(roundNumber(month.employerStampTaxExemption)).toEqual(27.15);

        expect(roundNumber(month.employeeSGKDeduction)).toEqual(500.85);
        expect(roundNumber(month.employeeSGKExemption)).toEqual(500.85);
        expect(roundNumber(month.employeeFinalSGKDeduction)).toEqual(0);

        expect(roundNumber(month.employeeUnemploymentInsuranceDeduction)).toEqual(35.78);
        expect(roundNumber(month.employeeUnemploymentInsuranceExemption)).toEqual(35.78);
        expect(roundNumber(month.employeeFinalUnemploymentInsuranceDeduction)).toEqual(0);

        expect(roundNumber(month.netSalary)).toEqual(2557.59);
        expect(roundNumber(month.finalNetSalary)).toEqual(2825.9);

        expect(roundNumber(month.employerSGKDeduction)).toEqual(733.39);
        expect(roundNumber(month.employerSGKExemption)).toEqual(733.39);
        expect(roundNumber(month.employerFinalSGKDeduction)).toEqual(0);

        expect(roundNumber(month.employerUnemploymentInsuranceDeduction)).toEqual(71.55);
        expect(roundNumber(month.employerUnemploymentInsuranceExemption)).toEqual(71.55);
        expect(roundNumber(month.employerFinalUnemploymentInsuranceDeduction)).toEqual(0);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(0);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(0);
        expect(roundNumber(month.employerTotalCost)).toEqual(2825.9);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 30 work days, 30 R&D days, gross salary 10000TL, 5746 Discount, AGI Bekar, Engelli degil, Ar-Ge 5746 Personel, Emekli Degil", () => {

        const workedDays = 30;
        const researchAndDevWorkedDays = 30;
        const applyEmployerDiscount5746 = true;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const salary = 10000;
        const employeeType = employeeTypes.options.find((o) => o.id === 3);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, researchAndDevWorkedDays,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            applyEmployerDiscount5746, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.netSalary)).toEqual(7149.10);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(2475);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(201.34);
        expect(roundNumber(month.employerTotalCost)).toEqual(10093.75);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 20 work days, 10 R&D days, gross salary 10000TL, 5746 Discount, AGI Bekar, Engelli degil, Ar-Ge 5746 Personel, Emekli Degil", () => {

        const workedDays = 20;
        const researchAndDevWorkedDays = 10;
        const applyEmployerDiscount5746 = true;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const salary = 10000;
        const employeeType = employeeTypes.options.find((o) => o.id === 3);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, researchAndDevWorkedDays,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            applyEmployerDiscount5746, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.netSalary)).toEqual(4766.07);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(1908.33);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(349.01);
        expect(roundNumber(month.employerTotalCost)).toEqual(7317.03);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 20 work days, 10 R&D days, gross salary 10000TL, 5746 Discount, AGI Bekar, Engelli degil, Teknokent Personel, Emekli Degil", () => {

        const workedDays = 20;
        const researchAndDevWorkedDays = 10;
        const applyEmployerDiscount5746 = true;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const salary = 10000;
        const employeeType = employeeTypes.options.find((o) => o.id === 2);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, researchAndDevWorkedDays,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            applyEmployerDiscount5746, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.netSalary)).toEqual(4766.07);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(1908.33);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(290.84);
        expect(roundNumber(month.employerTotalCost)).toEqual(7258.86);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 30 work days, gross salary 10000TL, AGI Bekar, Engelli degil, 6111 Personel, Emekli Degil", () => {

        const workedDays = 30;
        const researchAndDevWorkedDays = 0;
        const applyEmployerDiscount5746 = false;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const salary = 10000;
        const employeeType = employeeTypes.options.find((o) => o.id === 4);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, researchAndDevWorkedDays,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            applyEmployerDiscount5746, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.stampTax)).toEqual(75.9);
        expect(roundNumber(month.employerStampTaxExemption)).toEqual(0);

        expect(roundNumber(month.employeeSGKDeduction)).toEqual(1400);
        expect(roundNumber(month.employeeSGKExemption)).toEqual(0);
        expect(roundNumber(month.employeeFinalSGKDeduction)).toEqual(1400);

        expect(roundNumber(month.employeeUnemploymentInsuranceDeduction)).toEqual(100);
        expect(roundNumber(month.employeeUnemploymentInsuranceExemption)).toEqual(0);
        expect(roundNumber(month.employeeFinalUnemploymentInsuranceDeduction)).toEqual(100);

        expect(roundNumber(month.netSalary)).toEqual(7149.1);
        expect(roundNumber(month.finalNetSalary)).toEqual(7417.41);

        expect(roundNumber(month.employerSGKDeduction)).toEqual(2050);
        expect(roundNumber(month.employerSGKExemption)).toEqual(2050);
        expect(roundNumber(month.employerFinalSGKDeduction)).toEqual(0);

        expect(roundNumber(month.employerUnemploymentInsuranceDeduction)).toEqual(200);
        expect(roundNumber(month.employerUnemploymentInsuranceExemption)).toEqual(0);
        expect(roundNumber(month.employerFinalUnemploymentInsuranceDeduction)).toEqual(200);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(1700);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(1006.69);
        expect(roundNumber(month.employerTotalCost)).toEqual(10200);
    });

    it("calculate month for year 2021, from GROSS_TO_NET, 30 work days, gross salary 10000TL, AGI Bekar, Engelli degil, İşveren, Emekli Degil", () => {

        const workedDays = 30;
        const researchAndDevWorkedDays = 0;
        const applyEmployerDiscount5746 = false;
        const yearParams = yearParameters.find((y) => y.year === 2021);
        const salary = 10000;
        const employeeType = employeeTypes.options.find((o) => o.id === 5);
        const month = new MonthCalculationModel(parameters.CALCULATION_CONSTANTS);
        month.calculate(calcModes.options[0].id, yearParams, salary, workedDays, researchAndDevWorkedDays,
            AGIOptions.options[0].rate,
            employeeType, employeeEducationTypes.options[0].exemptionRate,
            applyEmployerDiscount5746, false, false, false,
            disabilityOptions.options[0].degree);

        expect(roundNumber(month.stampTax)).toEqual(75.9);
        expect(roundNumber(month.employerStampTaxExemption)).toEqual(0);
        expect(roundNumber(month.employerStampTax)).toEqual(75.9);

        expect(roundNumber(month.employeeSGKDeduction)).toEqual(0);
        expect(roundNumber(month.employeeSGKExemption)).toEqual(0);
        expect(roundNumber(month.employeeFinalSGKDeduction)).toEqual(0);

        expect(roundNumber(month.employeeUnemploymentInsuranceDeduction)).toEqual(0);
        expect(roundNumber(month.employeeUnemploymentInsuranceExemption)).toEqual(0);
        expect(roundNumber(month.employeeFinalUnemploymentInsuranceDeduction)).toEqual(0);

        expect(roundNumber(month.netSalary)).toEqual(8424.1);
        expect(roundNumber(month.finalNetSalary)).toEqual(8692.41);

        expect(roundNumber(month.employerSGKDeduction)).toEqual(0);
        expect(roundNumber(month.employerSGKExemption)).toEqual(0);
        expect(roundNumber(month.employerFinalSGKDeduction)).toEqual(0);

        expect(roundNumber(month.employerUnemploymentInsuranceDeduction)).toEqual(0);
        expect(roundNumber(month.employerUnemploymentInsuranceExemption)).toEqual(0);
        expect(roundNumber(month.employerFinalUnemploymentInsuranceDeduction)).toEqual(0);

        expect(roundNumber(month.employerTotalSGKCost)).toEqual(0);
        expect(roundNumber(month.employerFinalIncomeTax)).toEqual(roundNumber(month.employeeIncomeTax - month.AGIAmount));
        expect(roundNumber(month.employerTotalCost)).toEqual(10000);
    });

    const roundNumber = (num: number, precision = 2) => {
        return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
    };
});