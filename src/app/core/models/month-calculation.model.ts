import {YearDataModel} from "./year-data.model";
import {EmployeeType} from "../services/parameters.service";

export class MonthCalculationModel {
    monthName: string;
    private _previousMonth: MonthCalculationModel;
    private _employeeDisabledIncomeTaxBaseAmount: number;
    private _employerIncomeTaxExemptionAmount: number;

    private _calculatedGrossSalary: number;
    private _employeeSGKDeduction: number;
    private _employeeUnemploymentInsuranceDeduction: number;
    private _employeeIncomeTax: number;
    private _stampTax: number;
    private _netSalary: number;

    private _employerStampTax: number;
    private _employerStampTaxExemption: number;
    private _employerSGKDeduction: number;
    private _employerUnemploymentInsuranceDeduction: number;
    private _employerAGIamount: number;

    private _AGIamount: number;

    private _appliedTaxSlices: {
        rate: number;
        ceil: number;
    }[] = [];

    private _parameters;

    constructor(parameters: any) {
        this._parameters = parameters;
    }

    public calculate(calcMode: string, yearParams: YearDataModel,
                     enteredAmount: number, workedDays: number, researchAndDevelopmentWorkedDays: number, agiRate: number,
                     employeeType: EmployeeType, employeeEduExemptionRate: number,
                     applyEmployerDiscount5746: boolean, isAGIIncludedNet: boolean, isAGIIncludedTax: boolean,
                     isPensioner: boolean, disabilityDegree: number
    ) {
        if (!(enteredAmount > 0 && workedDays > 0)) {
            this.resetFields();
            return;
        }
        let grossSalary;
        if (calcMode === "GROSS_TO_NET") {
            grossSalary = enteredAmount;
        } else if (calcMode === "TOTAL_TO_GROSS") {
            grossSalary = this.findGrossFromTotalCost(yearParams, enteredAmount, workedDays, researchAndDevelopmentWorkedDays, agiRate, employeeType, employeeEduExemptionRate, applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, disabilityDegree);
        } else {
            grossSalary = this.findGrossFromNet(yearParams, enteredAmount, workedDays, researchAndDevelopmentWorkedDays, agiRate, employeeType, employeeEduExemptionRate, applyEmployerDiscount5746, isAGIIncludedNet, isAGIIncludedTax, isPensioner, disabilityDegree);
        }
        if (grossSalary === -1) {
            this.resetFields();
            throw new Error("hesaplama başarısız");
        }
        if (grossSalary < yearParams.minGrossWage) {
            grossSalary = yearParams.minGrossWage;
        }

        this._calculate(yearParams, grossSalary, workedDays, researchAndDevelopmentWorkedDays, agiRate, employeeType, employeeEduExemptionRate, applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, disabilityDegree);
        return 0;
    }

    public resetFields() {
        this._calculatedGrossSalary = 0;
        this._employeeSGKDeduction = 0;
        this._employeeUnemploymentInsuranceDeduction = 0;
        this._employeeIncomeTax = 0;
        this._employerIncomeTaxExemptionAmount = 0;
        this._employeeDisabledIncomeTaxBaseAmount = 0;

        this._employerUnemploymentInsuranceDeduction = 0;
        this._stampTax = 0;
        this._netSalary = 0;
        this._AGIamount = 0;
        this._employerAGIamount = 0;

        this._employerSGKDeduction = 0;
        this._employerStampTax = 0;
        this._employerStampTaxExemption = 0;
        this._appliedTaxSlices = [];
    }

    private _calculate(yearParams: YearDataModel,
                       grossSalary: number, workedDays: number, researchAndDevelopmentWorkedDays: number, agiRate: number,
                       employeeType: EmployeeType, employeeEduExemptionRate: number,
                       applyEmployerDiscount5746: boolean, isAGIIncludedTax: boolean,
                       isPensioner: boolean, disabilityDegree: number) {

        const cumIncomeTaxBase = this._previousMonth ? this._previousMonth.cumulativeIncomeTaxBase : 0;

        // some calculations are depended to others, so the order of execution matters
        this.calcGrossSalary(grossSalary, workedDays);
        this.calcDisabledIncomeTaxBaseAmount(yearParams, disabilityDegree, workedDays);
        this.calcEmployeeSGKDeduction(yearParams, isPensioner, employeeType);
        this.calcEmployeeUnemploymentInsuranceDeduction(yearParams, isPensioner, employeeType);
        this.calcStampTax(employeeType);
        this.calcEmployerStampTaxExemption(this._stampTax, employeeType, researchAndDevelopmentWorkedDays);
        this.calcEmployerStampTax(employeeType);
        this.calcEmployeeIncomeTax(cumIncomeTaxBase, yearParams, employeeType);

        this.calcNetSalary();

        this.calcEmployerSGKDeduction(yearParams, isPensioner, applyEmployerDiscount5746, employeeType, researchAndDevelopmentWorkedDays);
        this.calcEmployerUnemploymentInsuranceDeduction(yearParams, isPensioner, employeeType);

        this.calcAGI(yearParams, agiRate, employeeType, workedDays, grossSalary);
        this.calcEmployerAGI(employeeType);

        this.calcEmployerIncomeTaxExemption(employeeType, employeeEduExemptionRate, isAGIIncludedTax, researchAndDevelopmentWorkedDays);
    }

    private calcNetSalary() {
        this._netSalary = this.calculatedGrossSalary - (this.employeeSGKDeduction +
            this.employeeUnemploymentInsuranceDeduction + this.stampTax + this.employeeIncomeTax);
    }


    private calcEmployeeSGKDeduction(yearParams: YearDataModel, isPensioner: boolean, employeeType: EmployeeType) {
        let rate = 0;
        if (!employeeType.SGKApplicable) {
            return this._employeeSGKDeduction = 0;
        }
        if (isPensioner) {
            rate = this._parameters.employee.SGDPDeductionRate;
        } else {
            rate = this._parameters.employee.SGKDeductionRate;
        }
        if (this.calculatedGrossSalary < yearParams.SGKCeil) {
            this._employeeSGKDeduction = this.calculatedGrossSalary * rate;
        } else {
            this._employeeSGKDeduction = yearParams.SGKCeil * rate;
        }
    }

    private calcEmployerSGKDeduction(yearParams: YearDataModel,
                                     isPensioner: boolean,
                                     applyEmployerDiscount5746: boolean,
                                     employeeType: EmployeeType,
                                     researchAndDevelopmentWorkedDays: number) {
        if (!employeeType.employerSGKApplicable) {
            this._employerSGKDeduction = 0;
            return;
        }
        let rate;
        const grossSalary = Math.min(this.calculatedGrossSalary, yearParams.SGKCeil);
        if (isPensioner) {
            rate = this._parameters.employer.SGDPDeductionRate;
        } else {
            rate = this._parameters.employer.SGKDeductionRate;
        }
        if (!isPensioner) {
            if (rate > 0 && applyEmployerDiscount5746) {
                rate -= this._parameters.employer.employerDiscount5746;
            }
            if (employeeType.employer5746AdditionalDiscountApplicable) {
                if (!employeeType.researchAndDevelopmentEmployerSGKExemption) {
                    rate *= this._parameters.employer.SGK5746AdditionalDiscount;
                    this._employerSGKDeduction = grossSalary * rate;
                    return;
                }
                const nonResearchAndDevelopmentWorkedDays = this._parameters.monthDayCount - researchAndDevelopmentWorkedDays;
                this._employerSGKDeduction = (grossSalary * (nonResearchAndDevelopmentWorkedDays / this._parameters.monthDayCount) * rate) +
                    (grossSalary * (researchAndDevelopmentWorkedDays / this._parameters.monthDayCount) * rate * this._parameters.employer.SGK5746AdditionalDiscount);
                return;
            }
        }

        this._employerSGKDeduction = grossSalary * rate;
    }

    private calcEmployeeUnemploymentInsuranceDeduction(yearParams: YearDataModel, isPensioner: boolean, employeeType: EmployeeType) {
        let rate = 0;
        if (!employeeType.unemploymentInsuranceApplicable) {
            return this._employeeUnemploymentInsuranceDeduction = 0;
        }
        if (isPensioner) {
            rate = this._parameters.employee.pensionerUnemploymentInsuranceRate;
        } else {
            rate = this._parameters.employee.unemploymentInsuranceRate;
        }

        if (this.calculatedGrossSalary < yearParams.SGKCeil) {
            this._employeeUnemploymentInsuranceDeduction = this.calculatedGrossSalary * rate;
        } else {
            this._employeeUnemploymentInsuranceDeduction = yearParams.SGKCeil * rate;
        }
    }

    private calcEmployerUnemploymentInsuranceDeduction(yearParams: YearDataModel, isPensioner: boolean, employeeType: EmployeeType) {
        let rate = 0;
        if (!employeeType.employerUnemploymentInsuranceApplicable) {
            return this._employerUnemploymentInsuranceDeduction = 0;
        }
        if (isPensioner) {
            rate = this._parameters.employer.pensionerUnemploymentInsuranceRate;
        } else {
            rate = this._parameters.employer.unemploymentInsuranceRate;
        }

        if (this.calculatedGrossSalary < yearParams.SGKCeil) {
            this._employerUnemploymentInsuranceDeduction = this.calculatedGrossSalary * rate;
        } else {
            this._employerUnemploymentInsuranceDeduction = yearParams.SGKCeil * rate;
        }
    }

    private calcEmployeeIncomeTax(cumulativeSalary: number, yearParams: YearDataModel, employeeType: EmployeeType) {
        let tax = 0;
        if (!employeeType.incomeTaxApplicable) {
            this._employeeIncomeTax = tax;
            return;
        }
        this._appliedTaxSlices = [];
        let incomeBase = this.calcIncomeTaxBase;
        const n = yearParams.taxSlices.length - 1;

        for (let i = 0; i < n && incomeBase > 0; i++) {
            const ceil = yearParams.taxSlices[i].ceil;
            if (cumulativeSalary < ceil) {
                if ((cumulativeSalary + incomeBase) <= ceil) {
                    tax += incomeBase * yearParams.taxSlices[i].rate;
                    incomeBase = 0;

                } else {
                    const excessAmount = (cumulativeSalary + incomeBase) - ceil;
                    tax += (incomeBase - excessAmount) * yearParams.taxSlices[i].rate;
                    cumulativeSalary = ceil;
                    incomeBase = excessAmount;
                }
                this.appliedTaxSlices.push(yearParams.taxSlices[i]);
            }
        }
        if (incomeBase > 0) {
            this.appliedTaxSlices.push(yearParams.taxSlices[n]);
            tax += yearParams.taxSlices[n].rate * incomeBase;
        }
        this._employeeIncomeTax = tax;
    }


    private calcStampTax(employeeType: EmployeeType) {
        if (!employeeType.stampTaxApplicable) {
            this._stampTax = 0;
            return;
        }

        this._stampTax = (this.calculatedGrossSalary * this._parameters.stampTaxRate);
    }

    private calcEmployerStampTax(employeeType: EmployeeType) {
        this._employerStampTax = employeeType.employerStampTaxApplicable ? (this._stampTax - this._employerStampTaxExemption) : 0;
    }

    private calcAGI(yearParams: YearDataModel, AGIRate: number, employeeType: EmployeeType, workedDays: number, grossSalary: number) {
        if (employeeType.AGIApplicable) {
            let minWage = yearParams.minGrossWage * workedDays / this._parameters.monthDayCount;
            if (grossSalary < minWage) {
                minWage = grossSalary;
            }
            this._AGIamount = minWage * AGIRate * yearParams.taxSlices[0].rate;
        } else {
            this._AGIamount = 0;
        }
    }

    private calcEmployerAGI(employeeType: EmployeeType) {
        this._employerAGIamount = employeeType.employerAGIApplicable ? this._AGIamount : 0
    }

    private calcGrossSalary(grossSalary: number, dayCount: number) {

        this._calculatedGrossSalary = grossSalary * dayCount / this._parameters.monthDayCount;
    }

    private calcDisabledIncomeTaxBaseAmount(yearParams: YearDataModel, disabilityDegree: number, workedDays: number) {
        const disability = yearParams.disabledMonthlyIncomeTaxDiscountBases.find(option => option.degree == disabilityDegree);
        if (!disability) {
            this._employeeDisabledIncomeTaxBaseAmount = 0;
        } else {
            this._employeeDisabledIncomeTaxBaseAmount = disability.amount * workedDays / this._parameters.monthDayCount;
        }
    }

    private calcEmployerIncomeTaxExemption(employeeType: EmployeeType, employeeEduExemptionRate: number, isAGIIncludedTax: boolean, researchAndDevelopmentWorkedDays: number) {

        let exemption = 0;
        if (employeeType.employerIncomeTaxApplicable === false) {
            exemption = this.employeeIncomeTax;
        } else if (employeeType.employerEducationIncomeTaxExemption) {
            exemption = employeeEduExemptionRate * (this.employeeIncomeTax - this.AGIamount) * (researchAndDevelopmentWorkedDays / this._parameters.monthDayCount);
        } else if (employeeType.researchAndDevelopmentTaxExemption) {
            exemption = (this.employeeIncomeTax - this.AGIamount) * (researchAndDevelopmentWorkedDays / this._parameters.monthDayCount);
        }

        this._employerIncomeTaxExemptionAmount = exemption;
    }

    private calcEmployerStampTaxExemption(stampTaxAmount: number, employeeType: EmployeeType, researchAndDevelopmentWorkedDays: number) {

        let exemption = 0;
        if (!employeeType.stampTaxApplicable) {
            exemption = stampTaxAmount;
        } else if (employeeType.researchAndDevelopmentTaxExemption) {
            exemption = stampTaxAmount * (researchAndDevelopmentWorkedDays / this._parameters.monthDayCount);
        }
        this._employerStampTaxExemption = exemption;
    }

    /**
     * @summary finds equivalent gross salary from the entered net amount using binary search
     * @returns gross salary
     */
    private findGrossFromNet(yearParams: YearDataModel,
                             enteredAmount: number,
                             workedDays: number,
                             researchAndDevelopmentWorkedDays: number,
                             agiRate: number,
                             employeeType: EmployeeType,
                             employeeEduExemptionRate: number,
                             applyEmployerDiscount5746: boolean,
                             isAGIIncludedNet: boolean,
                             isAGIIncludedTax: boolean,
                             isPensioner: boolean,
                             disabilityDegree: number) {

        let left = enteredAmount;
        let right = 3 * enteredAmount;
        let middle = (right + left) / 2;
        const itLimit = 100;
        let calcNetSalary = null;
        for (let i = 0; i < itLimit && Math.abs(calcNetSalary - enteredAmount) > 0.0001; i++) {

            // could not find
            if (right < left) {
                return -1;
            }

            this._calculate(yearParams, middle, workedDays, researchAndDevelopmentWorkedDays,
                agiRate, employeeType, employeeEduExemptionRate,
                applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, disabilityDegree);
            calcNetSalary = isAGIIncludedNet ? this.netSalary + this.AGIamount : this.netSalary;
            if (calcNetSalary > enteredAmount) {
                right = middle;
            } else {
                left = middle;
            }
            middle = (right + left) / 2;
        }
        return middle;
    }

    /**
     * @summary finds equivalent gross salary from the entered total cost amount using binary search
     * @returns gross Salary
     */
    private findGrossFromTotalCost(yearParams: YearDataModel,
                                   enteredAmount: number,
                                   workedDays: number,
                                   researchAndDevelopmentWorkedDays: number,
                                   agiRate: number,
                                   employeeType: EmployeeType,
                                   employeeEduExemptionRate: number,
                                   applyEmployerDiscount5746: boolean,
                                   isAGIIncludedTax: boolean,
                                   isPensioner: boolean,
                                   disabilityDegree: number) {

        let left = enteredAmount / 3;
        let right = enteredAmount * 2;
        let middle = (right + left) / 2;
        const itLimit = 100;
        let calcTotalCost = null;
        let i;
        for (i = 0; i < itLimit && Math.abs(calcTotalCost - enteredAmount) > 0.0001; i++) {

            // could not find
            if (right < left) {
                return -1;
            }

            this._calculate(yearParams, middle, workedDays, researchAndDevelopmentWorkedDays, agiRate, employeeType,
                employeeEduExemptionRate, applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, disabilityDegree);
            calcTotalCost = this.employerTotalCost;
            if (calcTotalCost > enteredAmount) {
                right = middle;
            } else {
                left = middle;
            }
            middle = (right + left) / 2;
        }

        if (i === itLimit) {
            return -1;
        }
        return middle;
    }

    set previousMonth(month: MonthCalculationModel) {
        this._previousMonth = month;
    }

    public get employerIncomeTaxExemptionAmount(): number {
        return this._employerIncomeTaxExemptionAmount;
    }

    public get cumulativeSalary(): number {
        if (this._previousMonth) {
            const cumSalary: number = this._previousMonth.cumulativeSalary;
            return this.calculatedGrossSalary + cumSalary;
        }
        return this.calculatedGrossSalary;
    }

    public get calcIncomeTaxBase() {
        return this.calculatedGrossSalary - (this.employeeSGKDeduction + this.employeeUnemploymentInsuranceDeduction + this._employeeDisabledIncomeTaxBaseAmount);
    }

    public get cumulativeIncomeTaxBase(): number {
        if (this._previousMonth) {
            const cumBase: number = this._previousMonth.cumulativeIncomeTaxBase;
            return this.calcIncomeTaxBase + cumBase;
        }
        return this.calcIncomeTaxBase;
    }
    public get employerFinalIncomeTax() {
        return this.employeeIncomeTax - this.employerIncomeTaxExemptionAmount - this.AGIamount;
    }

    public get appliedTaxSlicesAsString() {
        return this.appliedTaxSlices.map(o => o.rate * 100).join("-");
    }

    public get finalNetSalary() {
        return this.netSalary + this.AGIamount;
    }

    public get calculatedGrossSalary(): number {
        return this._calculatedGrossSalary;
    }

    public get employeeSGKDeduction(): number {
        return this._employeeSGKDeduction;
    }

    public get employeeUnemploymentInsuranceDeduction(): number {
        return this._employeeUnemploymentInsuranceDeduction;
    }

    public get employeeIncomeTax(): number {
        return this._employeeIncomeTax;
    }
    public get employerSGKDeduction(): number {
        return this._employerSGKDeduction;
    }

    public get employerUnemploymentInsuranceDeduction(): number {
        return this._employerUnemploymentInsuranceDeduction;
    }

    public get netSalary(): number {
        return this._netSalary;
    }

    public get stampTax(): number {
        return this._stampTax;
    }

    public get employerStampTaxExemption(): number {
        return this._employerStampTaxExemption;
    }

    public get AGIamount(): number {
        return this._AGIamount;
    }

    public get employerStampTax() {
        return this._employerStampTax;
    }

    public get employerTotalSGKCost() {
        return this.employeeSGKDeduction + this.employeeUnemploymentInsuranceDeduction +
            +this.employerSGKDeduction + this.employerUnemploymentInsuranceDeduction;
    }

    public get employerTotalCost() {
        return this.netSalary + this.employerAGIAmount + this.employerTotalSGKCost + this.employerStampTax +
            this.employerFinalIncomeTax;
    }

    public get employerAGIAmount() {
        return this._employerAGIamount;
    }

    public get appliedTaxSlices(): {
        rate: number;
        ceil: number;
    }[] {
        return this._appliedTaxSlices;
    }
}
