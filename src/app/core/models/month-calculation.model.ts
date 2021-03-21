import {TaxSliceModel, YearDataModel} from "./year-data.model";
import {CalculationConstants, EmployeeType} from "../services/parameters.service";

export class MonthCalculationModel {
    monthName: string;
    private _previousMonth: MonthCalculationModel;
    private _employeeDisabledIncomeTaxBaseAmount: number;
    private _employerIncomeTaxExemptionAmount: number;

    private _calculatedGrossSalary: number;
    /**
     * SGK Matrahı
     */
    private _SGKBase: number;
    private _employeeSGKDeduction: number;
    private _employeeSGKExemptionAmount: number;
    private _employeeUnemploymentInsuranceDeduction: number;
    private _employeeUnemploymentInsuranceExemptionAmount: number;
    private _employeeIncomeTax: number;
    private _stampTax: number;
    private _netSalary: number;

    private _employerStampTax: number;
    private _employerStampTaxExemption: number;
    private _employerSGKDeduction: number;
    private _employerSGKExemptionAmount: number;
    private _employerUnemploymentInsuranceDeduction: number;
    private _employerUnemploymentInsuranceExemptionAmount: number;
    private _employerAGIamount: number;

    private _AGIamount: number;

    private _appliedTaxSlices: TaxSliceModel[] = [];

    private _parameters;

    public static calcGrossSalary(grossSalary: number, dayCount: number, monthDayCount: number): number {
        return grossSalary * dayCount / monthDayCount;
    }

    public static calcIncomeTaxBase(calculatedGrossSalary: number,
                                    employeeSGKDeduction: number,
                                    employeeUnemploymentInsuranceDeduction: number,
                                    employeeDisabledIncomeTaxBaseAmount = 0): number {
        return calculatedGrossSalary -
            (employeeSGKDeduction + employeeUnemploymentInsuranceDeduction + employeeDisabledIncomeTaxBaseAmount);
    }

    public static calcSGKBase(yearParams: YearDataModel, grossSalary: number, workedDays: number, monthDayCount: number): number {
        return Math.min(grossSalary, yearParams.SGKCeil) * workedDays / monthDayCount;
    }

    public static calcDisabledIncomeTaxBaseAmount(yearParams: YearDataModel,
                                                  disabilityDegree: number,
                                                  workedDays: number,
                                                  monthDayCount: number): number {
        const disability = yearParams.disabledMonthlyIncomeTaxDiscountBases.find(option => option.degree == disabilityDegree);
        let baseAmount = 0;
        if (!disability) {
            baseAmount = 0;
        } else {
            baseAmount = disability.amount * workedDays / monthDayCount;
        }
        return baseAmount;
    }

    public static calcEmployeeSGKDeduction(isPensioner: boolean,
                                           employeeType: EmployeeType,
                                           constants: CalculationConstants,
                                           SGKBase: number): number {
        let rate = 0;
        let SGKDeduction = 0;
        if (!employeeType.SGKApplicable) {
            SGKDeduction = 0;
            return SGKDeduction;
        }
        if (isPensioner) {
            rate = constants.employee.SGDPDeductionRate;
        } else {
            rate = constants.employee.SGKDeductionRate;
        }

        return SGKBase * rate;
    }

    public static calcEmployeeSGKExemption(yearParams: YearDataModel,
                                           employeeType: EmployeeType,
                                           workedDays: number,
                                           constants: CalculationConstants): number {
        let exemption = 0;
        if (!employeeType.SGKApplicable) {
            return exemption;
        }
        if (employeeType.SGKMinWageBasedExemption) {
            exemption = yearParams.minGrossWage * constants.employee.SGKDeductionRate
                * workedDays / constants.monthDayCount;
        }
        return exemption;
    }

    public static calcEmployeeUnemploymentInsuranceDeduction(isPensioner: boolean,
                                                             employeeType: EmployeeType,
                                                             constants: CalculationConstants,
                                                             SGKBase: number): number {
        let rate = 0;
        if (!employeeType.unemploymentInsuranceApplicable) {
            return 0;
        }
        if (isPensioner) {
            rate = constants.employee.pensionerUnemploymentInsuranceRate;
        } else {
            rate = constants.employee.unemploymentInsuranceRate;
        }

        return SGKBase * rate;
    }

    public static calcStampTax(employeeType: EmployeeType, constants: CalculationConstants, grossSalary: number): number {
        if (!employeeType.stampTaxApplicable) {
            return 0;
        }
        return (grossSalary * constants.stampTaxRate);
    }

    public static calcEmployerStampTaxExemption(yearParams: YearDataModel,
                                                stampTaxAmount: number,
                                                employeeType: EmployeeType,
                                                constants: CalculationConstants,
                                                workedDays: number,
                                                researchAndDevelopmentWorkedDays: number) {

        let exemption = 0;
        if (!employeeType.stampTaxApplicable) {
            exemption = stampTaxAmount;
        } else if (employeeType.researchAndDevelopmentTaxExemption) {
            exemption = stampTaxAmount * (researchAndDevelopmentWorkedDays / constants.monthDayCount);
        } else if (employeeType.taxMinWageBasedExemption) {
            const taxBase = MonthCalculationModel.calcGrossSalary(yearParams.minGrossWage, workedDays, constants.monthDayCount);
            exemption = MonthCalculationModel.calcStampTax(employeeType, constants, taxBase);
        }
        return exemption;
    }

    public static calcEmployeeUnemploymentInsuranceExemption(yearParams: YearDataModel,
                                                             employeeType: EmployeeType,
                                                             workedDays: number,
                                                             constants: CalculationConstants): number {
        let exemption = 0;
        if (!employeeType.unemploymentInsuranceApplicable) {
            return exemption;
        }

        if (employeeType.SGKMinWageBasedExemption) {
            exemption = yearParams.minGrossWage
                * constants.employee.unemploymentInsuranceRate
                * workedDays / constants.monthDayCount;
        }
        return exemption;
    }

    public static calcEmployeeIncomeTax(cumulativeSalary: number,
                                        yearParams: YearDataModel,
                                        employeeType: EmployeeType,
                                        incomeTaxBase: number): { appliedTaxSlices: TaxSliceModel[], tax: number } {

        const result = {tax: 0, appliedTaxSlices: []};
        if (!employeeType.incomeTaxApplicable) {
            return result;
        }

        const n = yearParams.taxSlices.length - 1;

        for (let i = 0; i < n && incomeTaxBase > 0; i++) {
            const ceil = yearParams.taxSlices[i].ceil;
            if (cumulativeSalary < ceil) {
                if ((cumulativeSalary + incomeTaxBase) <= ceil) {
                    result.tax += incomeTaxBase * yearParams.taxSlices[i].rate;
                    incomeTaxBase = 0;

                } else {
                    const excessAmount = (cumulativeSalary + incomeTaxBase) - ceil;
                    result.tax += (incomeTaxBase - excessAmount) * yearParams.taxSlices[i].rate;
                    cumulativeSalary = ceil;
                    incomeTaxBase = excessAmount;
                }
                result.appliedTaxSlices.push(yearParams.taxSlices[i]);
            }
        }
        if (incomeTaxBase > 0) {
            result.appliedTaxSlices.push(yearParams.taxSlices[n]);
            result.tax += yearParams.taxSlices[n].rate * incomeTaxBase;
        }
        return result;
    }

    public static calcNetSalary(grossSalary: number,
                                SGKDeduction: number,
                                employeeUnemploymentInsuranceDeduction: number,
                                stampTax: number,
                                employeeIncomeTax: number): number {
        return grossSalary - (SGKDeduction +
            employeeUnemploymentInsuranceDeduction + stampTax + employeeIncomeTax);
    }

    public static calcEmployerSGKDeduction(isPensioner: boolean,
                                           applyEmployerDiscount5746: boolean,
                                           employeeType: EmployeeType,
                                           constants: CalculationConstants,
                                           researchAndDevelopmentWorkedDays: number,
                                           SGKBase: number
    ) {
        let deduction = 0;
        if (!employeeType.employerSGKApplicable) {
            return deduction;
        }
        let rate;

        if (isPensioner) {
            rate = constants.employer.SGDPDeductionRate;
        } else {
            rate = constants.employer.SGKDeductionRate;
        }
        if (!isPensioner) {
            if (rate > 0 && applyEmployerDiscount5746) {
                rate -= constants.employer.employerDiscount5746;
            }
            if (employeeType.employer5746AdditionalDiscountApplicable) {
                if (!employeeType.researchAndDevelopmentEmployerSGKExemption) {
                    rate *= constants.employer.SGK5746AdditionalDiscount;
                    deduction = SGKBase * rate;
                    return deduction;
                }
                const nonResearchAndDevelopmentWorkedDays = constants.monthDayCount - researchAndDevelopmentWorkedDays;
                deduction = (SGKBase * (nonResearchAndDevelopmentWorkedDays / constants.monthDayCount) * rate) +
                    (SGKBase * (researchAndDevelopmentWorkedDays / constants.monthDayCount)
                        * rate * constants.employer.SGK5746AdditionalDiscount);
                return deduction;
            }
        }

        deduction = SGKBase * rate;
        return deduction;
    }

    public static calcEmployerSGKExemption(yearParams: YearDataModel,
                                           employeeType: EmployeeType,
                                           constants: CalculationConstants,
                                           SGKBase: number,
                                           isPensioner: boolean,
                                           applyEmployerDiscount5746: boolean,
                                           workedDays: number): number {
        let exemption = 0;
        if (!employeeType.employerSGKApplicable) {
            return exemption;
        }
        if (employeeType.SGKMinWageBasedExemption) {
            const minWageSGKBase = MonthCalculationModel.calcGrossSalary(yearParams.minGrossWage, workedDays, constants.monthDayCount);
            exemption = MonthCalculationModel.calcEmployerSGKDeduction(isPensioner, applyEmployerDiscount5746,
                employeeType, constants, 0, (SGKBase - minWageSGKBase));
        }
        return exemption;
    }

    public static calcEmployerUnemploymentInsuranceDeduction(isPensioner: boolean,
                                                             employeeType: EmployeeType,
                                                             constants: CalculationConstants,
                                                             SGKBase: number) {
        let rate = 0;
        if (!employeeType.employerUnemploymentInsuranceApplicable) {
            return 0;
        }
        if (isPensioner) {
            rate = constants.employer.pensionerUnemploymentInsuranceRate;
        } else {
            rate = constants.employer.unemploymentInsuranceRate;
        }

        return SGKBase * rate;
    }

    public static calcEmployerUnemploymentInsuranceExemption(yearParams: YearDataModel,
                                                             employeeType: EmployeeType,
                                                             constants: CalculationConstants,
                                                             SGKBase: number,
                                                             workedDays: number) {
        let exemption = 0;
        if (!employeeType.employerUnemploymentInsuranceApplicable) {
            return exemption;
        }
        if (employeeType.SGKMinWageBasedExemption) {
            exemption = (SGKBase - (yearParams.minGrossWage
                * workedDays / constants.monthDayCount))
                * constants.employer.unemploymentInsuranceRate;
        }
        return exemption;
    }

    public static calcAGI(yearParams: YearDataModel,
                          AGIRate: number,
                          employeeType: EmployeeType,
                          employeeTax: number
    ) {
        let agi = 0;
        if (!employeeType.AGIApplicable) {
            return agi;
        }

        agi = yearParams.minGrossWage * AGIRate * yearParams.taxSlices[0].rate;

        return Math.min(agi, employeeTax);
    }

    public static calcEmployerIncomeTaxExemption(yearParams: YearDataModel,
                                                 employeeType: EmployeeType,
                                                 constants: CalculationConstants,
                                                 employeeEduExemptionRate: number,
                                                 isAGIIncludedTax: boolean,
                                                 workedDays: number,
                                                 researchAndDevelopmentWorkedDays: number,
                                                 employeeIncomeTax: number,
                                                 AGIAmount: number,
                                                 isPensioner: boolean,
                                                 disabilityDegree: number): number {

        let exemption = 0;
        if (!employeeType.employerIncomeTaxApplicable) {
            exemption = employeeIncomeTax;
        } else if (employeeType.employerEducationIncomeTaxExemption) {
            exemption = employeeEduExemptionRate * (employeeIncomeTax - AGIAmount)
                * (researchAndDevelopmentWorkedDays / constants.monthDayCount);
        } else if (employeeType.researchAndDevelopmentTaxExemption) {
            exemption = (employeeIncomeTax - AGIAmount) * (researchAndDevelopmentWorkedDays / constants.monthDayCount);
        } else if (employeeType.taxMinWageBasedExemption) {

            if ((employeeIncomeTax - AGIAmount) > 0) {
                const taxBase = MonthCalculationModel.calcGrossSalary(yearParams.minGrossWage, workedDays, constants.monthDayCount);
                const SGKBase = MonthCalculationModel.calcSGKBase(yearParams, yearParams.minGrossWage, workedDays, constants.monthDayCount);
                const minWageBasedIncomeTax = MonthCalculationModel.calcEmployeeIncomeTaxOfTheGivenGrossSalary(yearParams,
                    employeeType, constants, taxBase, SGKBase, workedDays, isPensioner, disabilityDegree);
                exemption = Math.min(employeeIncomeTax - AGIAmount, minWageBasedIncomeTax.tax - AGIAmount);
            }
        }

        return exemption;
    }

    /**
     * @param yearParams
     * @param employeeType
     * @param constants
     * @param calculatedGrossSalary bordroya esas brut ucret
     * @param SGKBase SGK Matrahi
     * @param workedDays
     * @param isPensioner
     * @param disabilityDegree
     */
    public static calcEmployeeIncomeTaxOfTheGivenGrossSalary(yearParams: YearDataModel,
                                                             employeeType: EmployeeType,
                                                             constants: CalculationConstants,
                                                             calculatedGrossSalary: number,
                                                             SGKBase: number,
                                                             workedDays: number,
                                                             isPensioner: boolean,
                                                             disabilityDegree: number) {

        const employeeSGKDeduction = MonthCalculationModel.calcEmployeeSGKDeduction(isPensioner, employeeType,
            constants, SGKBase);
        const employeeUnemploymentInsuranceDeduction = MonthCalculationModel.calcEmployeeUnemploymentInsuranceDeduction(
            isPensioner, employeeType, constants, SGKBase);
        const employeeDisabledIncomeTaxBaseAmount = MonthCalculationModel.calcDisabledIncomeTaxBaseAmount(yearParams,
            disabilityDegree, workedDays, constants.monthDayCount);
        const incomeTaxBase = MonthCalculationModel.calcIncomeTaxBase(calculatedGrossSalary,
            employeeSGKDeduction,
            employeeUnemploymentInsuranceDeduction,
            employeeDisabledIncomeTaxBaseAmount);

        return MonthCalculationModel.calcEmployeeIncomeTax(0, yearParams, employeeType, incomeTaxBase);
    }

    private static calcEmployerStampTax(employeeType: EmployeeType, stampTax: number, stampTaxExemption: number) {
        return employeeType.employerStampTaxApplicable ? (stampTax - stampTaxExemption) : 0;
    }

    private static calcEmployerAGI(employeeType: EmployeeType, AGIAmount: number) {
        return employeeType.employerAGIApplicable ? AGIAmount : 0;
    }

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
            grossSalary = this.findGrossFromTotalCost(yearParams, enteredAmount, workedDays,
                researchAndDevelopmentWorkedDays, agiRate, employeeType, employeeEduExemptionRate,
                applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, disabilityDegree);
        } else {
            grossSalary = this.findGrossFromNet(yearParams, enteredAmount, workedDays,
                researchAndDevelopmentWorkedDays, agiRate, employeeType, employeeEduExemptionRate,
                applyEmployerDiscount5746, isAGIIncludedNet, isAGIIncludedTax, isPensioner, disabilityDegree);
        }
        if (grossSalary === -1) {
            this.resetFields();
            throw new Error("hesaplama başarısız");
        }
        if (grossSalary < yearParams.minGrossWage) {
            grossSalary = yearParams.minGrossWage;
        }

        this._calculate(yearParams, grossSalary, workedDays, researchAndDevelopmentWorkedDays,
            agiRate, employeeType, employeeEduExemptionRate, applyEmployerDiscount5746,
            isAGIIncludedTax, isPensioner, disabilityDegree);
        return 0;
    }

    public resetFields() {
        this._calculatedGrossSalary = 0;
        this._SGKBase = 0;
        this._employeeSGKDeduction = 0;
        this._employeeSGKExemptionAmount = 0;
        this._employeeUnemploymentInsuranceDeduction = 0;
        this._employeeUnemploymentInsuranceExemptionAmount = 0;
        this._employeeIncomeTax = 0;
        this._employerIncomeTaxExemptionAmount = 0;
        this._employeeDisabledIncomeTaxBaseAmount = 0;

        this._employerUnemploymentInsuranceDeduction = 0;
        this._employerUnemploymentInsuranceExemptionAmount = 0;
        this._stampTax = 0;
        this._netSalary = 0;
        this._AGIamount = 0;
        this._employerAGIamount = 0;

        this._employerSGKDeduction = 0;
        this._employerSGKExemptionAmount = 0;
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
        this._calculatedGrossSalary = MonthCalculationModel.calcGrossSalary(grossSalary, workedDays, this._parameters.monthDayCount);

        this._SGKBase = MonthCalculationModel.calcSGKBase(yearParams, grossSalary,
            workedDays, this._parameters.monthDayCount);

        this._employeeDisabledIncomeTaxBaseAmount = MonthCalculationModel.calcDisabledIncomeTaxBaseAmount(yearParams,
            disabilityDegree, workedDays, this._parameters.monthDayCount);

        this._employeeSGKDeduction = MonthCalculationModel.calcEmployeeSGKDeduction(isPensioner, employeeType,
            this._parameters, this.SGKBase);

        this._employeeSGKExemptionAmount = MonthCalculationModel.calcEmployeeSGKExemption(yearParams, employeeType,
            workedDays, this._parameters);

        this._employeeUnemploymentInsuranceDeduction = MonthCalculationModel.calcEmployeeUnemploymentInsuranceDeduction(
            isPensioner, employeeType, this._parameters, this.SGKBase);

        this._employeeUnemploymentInsuranceExemptionAmount = MonthCalculationModel.calcEmployeeUnemploymentInsuranceExemption(yearParams,
            employeeType, workedDays, this._parameters);

        this._stampTax = MonthCalculationModel.calcStampTax(employeeType, this._parameters, this.calculatedGrossSalary);

        this._employerStampTaxExemption = MonthCalculationModel.calcEmployerStampTaxExemption(yearParams, this._stampTax, employeeType,
            this._parameters, workedDays, researchAndDevelopmentWorkedDays);

        this._employerStampTax = MonthCalculationModel.calcEmployerStampTax(employeeType, this._stampTax, this._employerStampTaxExemption);

        const incomeTaxResult = MonthCalculationModel.calcEmployeeIncomeTax(cumIncomeTaxBase, yearParams, employeeType, this.incomeTaxBase);
        this._employeeIncomeTax = incomeTaxResult.tax;
        this._appliedTaxSlices = incomeTaxResult.appliedTaxSlices;

        this._netSalary = MonthCalculationModel.calcNetSalary(this.calculatedGrossSalary, this.employeeSGKDeduction,
            this.employeeUnemploymentInsuranceDeduction, this.stampTax, this.employeeIncomeTax);

        this._employerSGKDeduction = MonthCalculationModel.calcEmployerSGKDeduction(isPensioner, applyEmployerDiscount5746,
            employeeType, this._parameters, researchAndDevelopmentWorkedDays, this.SGKBase);

        this._employerSGKExemptionAmount = MonthCalculationModel.calcEmployerSGKExemption(yearParams, employeeType,
            this._parameters, this.SGKBase, isPensioner, applyEmployerDiscount5746, workedDays);

        this._employerUnemploymentInsuranceDeduction = MonthCalculationModel.calcEmployerUnemploymentInsuranceDeduction(
            isPensioner, employeeType, this._parameters, this.SGKBase);

        this._employerUnemploymentInsuranceExemptionAmount = MonthCalculationModel.calcEmployerUnemploymentInsuranceExemption(yearParams,
            employeeType, this._parameters, this.SGKBase, workedDays);

        this._AGIamount = MonthCalculationModel.calcAGI(yearParams, agiRate, employeeType, this.employeeIncomeTax);

        this._employerAGIamount = MonthCalculationModel.calcEmployerAGI(employeeType, this._AGIamount);

        this._employerIncomeTaxExemptionAmount = MonthCalculationModel.calcEmployerIncomeTaxExemption(yearParams, employeeType,
            this._parameters, employeeEduExemptionRate, isAGIIncludedTax, workedDays,
            researchAndDevelopmentWorkedDays, this.employeeIncomeTax, this.AGIamount, isPensioner, disabilityDegree);
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

    public get incomeTaxBase() {
        return MonthCalculationModel.calcIncomeTaxBase(this.calculatedGrossSalary,
            this.employeeSGKDeduction,
            this.employeeUnemploymentInsuranceDeduction,
            this._employeeDisabledIncomeTaxBaseAmount);
    }

    public get cumulativeIncomeTaxBase(): number {
        if (this._previousMonth) {
            const cumBase: number = this._previousMonth.cumulativeIncomeTaxBase;
            return this.incomeTaxBase + cumBase;
        }
        return this.incomeTaxBase;
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

    /**
     * SKG Matrahi
     */
    public get SGKBase() {
        return this._SGKBase;
    }

    public get employeeSGKDeduction(): number {
        return this._employeeSGKDeduction;
    }

    public get employeeSGKExemption(): number {
        return this._employeeSGKExemptionAmount;
    }

    public get employeeFinalSGKDeduction(): number {
        return this.employeeSGKDeduction - this.employeeSGKExemption;
    }

    public get employeeUnemploymentInsuranceDeduction(): number {
        return this._employeeUnemploymentInsuranceDeduction;
    }

    public get employeeUnemploymentInsuranceExemption(): number {
        return this._employeeUnemploymentInsuranceExemptionAmount;
    }

    public get employeeFinalUnemploymentInsuranceDeduction(): number {
        return this.employeeUnemploymentInsuranceDeduction - this.employeeUnemploymentInsuranceExemption;
    }

    public get employeeIncomeTax(): number {
        return this._employeeIncomeTax;
    }

    public get employerSGKDeduction(): number {
        return this._employerSGKDeduction;
    }

    public get employerSGKExemption(): number {
        return this._employerSGKExemptionAmount;
    }

    public get employerFinalSGKDeduction(): number {
        return this.employerSGKDeduction - this.employerSGKExemption;
    }

    public get employerUnemploymentInsuranceDeduction(): number {
        return this._employerUnemploymentInsuranceDeduction;
    }

    public get employerUnemploymentInsuranceExemption(): number {
        return this._employerUnemploymentInsuranceExemptionAmount;
    }

    public get employerFinalUnemploymentInsuranceDeduction(): number {
        return this.employerUnemploymentInsuranceDeduction - this.employerUnemploymentInsuranceExemption;
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
        return this.employeeFinalSGKDeduction + this.employeeFinalUnemploymentInsuranceDeduction
            + this.employerFinalSGKDeduction + this.employerFinalUnemploymentInsuranceDeduction;
    }

    public get employerTotalCost() {
        return this.netSalary + this.employerAGIAmount + this.employerTotalSGKCost + this.employerStampTax +
            this.employerFinalIncomeTax;
    }

    public get employerAGIAmount() {
        return this._employerAGIamount;
    }

    public get appliedTaxSlices(): TaxSliceModel[] {
        return this._appliedTaxSlices;
    }
}
