import {MinGrossWage, TaxSliceModel, YearDataModel} from "./year-data.model";
import {CalculationConstants, EmployeeType} from "../services/parameters.service";

export class MonthCalculationModel {

    monthName: string;
    monthNumber: number;
    private _previousMonth: MonthCalculationModel;
    private _workedDays: number;
    private _researchAndDevelopmentWorkedDays: number;
    private _employeeDisabledIncomeTaxBaseAmount: number;
    private _employerIncomeTaxExemptionAmount: number;

    private _grossSalaryForTaxBaseCalculation: number;
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
    private _employeeIncomeTaxExemptionAmount: number;
    private _stampTax: number;
    private _netSalary: number;

    private _employerStampTax: number;
    private _employerStampTaxExemption: number;
    private _employeeStampTaxExemption: number;
    private _employerSGKDeduction: number;
    private _employerSGKExemptionAmount: number;
    private _employerUnemploymentInsuranceDeduction: number;
    private _employerUnemploymentInsuranceExemptionAmount: number;

    private _AGIAmount: number;

    private _appliedTaxSlices: TaxSliceModel[] = [];

    private readonly _parameters;

    private readonly _standardEmployeeType: EmployeeType;

    public static getMinGrossWage(yearParams: YearDataModel, monthNumber: number): MinGrossWage {
        for (const minWage of yearParams.minGrossWages) {
            if (monthNumber >= minWage.startMonth) {
                return minWage;
            }
        }
    }

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

    public static calcSGKBase(
        minGrossWage: MinGrossWage,
        grossSalary: number,
        workedDays: number,
        monthDayCount: number,
    ): number {
        return Math.min(grossSalary, minGrossWage.SGKCeil) * workedDays / monthDayCount;
    }

    public static calcDisabledIncomeTaxBaseAmount(yearParams: YearDataModel,
                                                  disabilityDegree: number,
                                                  workedDays: number,
                                                  monthDayCount: number): number {
        const disability = yearParams.disabledMonthlyIncomeTaxDiscountBases.find(option => option.degree == disabilityDegree);
        let baseAmount = 0;
        if (disability) {
            baseAmount = disability.amount * workedDays / monthDayCount;
        }
        return baseAmount;
    }

    public static calcEmployeeSGKDeduction(isPensioner: boolean,
                                           employeeType: EmployeeType,
                                           constants: CalculationConstants,
                                           SGKBase: number): number {
        if (!employeeType.SGKApplicable) {
            return 0;
        }

        const rate = isPensioner ? constants.employee.SGDPDeductionRate : constants.employee.SGKDeductionRate;

        return SGKBase * rate;
    }

    public static calcEmployeeSGKExemption(
        minGrossWage: MinGrossWage,
        employeeType: EmployeeType,
        isPensioner: boolean,
        workedDays: number,
        constants: CalculationConstants,
        employeeSGKDeduction: number
    ): number {
        let exemption = 0;
        if (!employeeType.SGKApplicable || isPensioner) {
            return exemption;
        }
        if (employeeType.SGKMinWageBasedExemption) {
            exemption = minGrossWage.amount * constants.employee.SGKDeductionRate
                * workedDays / constants.monthDayCount;
        } else if (employeeType.SGKMinWageBased17103Exemption) {
            const totalSGKRate = this.calcTotalSGKRate(constants);
            exemption = (minGrossWage.amount / totalSGKRate) * constants.employee.SGKDeductionRate
                * workedDays / constants.monthDayCount;
            exemption = Math.min(employeeSGKDeduction, exemption);
        }
        return exemption;
    }

    /**
     * basically returns 0.375
     */
    public static calcTotalSGKRate(constants: CalculationConstants) {
        return constants.employee.SGKDeductionRate + constants.employee.unemploymentInsuranceRate
            + constants.employer.SGKDeductionRate + constants.employer.unemploymentInsuranceRate;
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

    public static calcStampTax(
        employeeType: EmployeeType,
        constants: CalculationConstants,
        yearParams: YearDataModel,
        grossSalary: number
    ): number {
        if (!employeeType.stampTaxApplicable) {
            return 0;
        }

        return (grossSalary * constants.stampTaxRate);
    }

    public static calcEmployerStampTaxExemption(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        stampTaxAmount: number,
        employeeType: EmployeeType,
        constants: CalculationConstants,
        workedDays: number,
        researchAndDevelopmentWorkedDays: number,
        employeeStampTaxExemptionAmount: number,
    ) {

        let exemption = 0;
        if (!employeeType.stampTaxApplicable) {
            exemption = stampTaxAmount;
        } else if (employeeType.researchAndDevelopmentTaxExemption) {
            exemption = Math.max(stampTaxAmount - employeeStampTaxExemptionAmount, 0) * (researchAndDevelopmentWorkedDays / workedDays);
        } else if (!yearParams.minWageEmployeeTaxExemption && employeeType.taxMinWageBasedExemption) {
            const taxBase = MonthCalculationModel.calcGrossSalary(minGrossWage.amount, workedDays, constants.monthDayCount);
            exemption = MonthCalculationModel.calcStampTax(employeeType, constants, yearParams, taxBase);
        }
        return exemption;
    }

    public static calcEmployeeStampTaxExemption(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        stampTaxAmount: number,
        employeeType: EmployeeType,
        standardEmployeeType: EmployeeType,
        constants: CalculationConstants,
        grossSalary: number,
        workedDays: number,
        researchAndDevelopmentWorkedDays: number,
        applyMinWageTaxExemption: boolean,
    ) {

        let exemption = 0;
        let minWageTaxBase = 0;
        if (applyMinWageTaxExemption && yearParams.minWageEmployeeTaxExemption) {
            minWageTaxBase = MonthCalculationModel.calcGrossSalary(
                minGrossWage.amount,
                constants.monthDayCount,
                constants.monthDayCount
            );
            exemption = MonthCalculationModel.calcStampTax(standardEmployeeType, constants, yearParams, minWageTaxBase);
            exemption = Math.min(stampTaxAmount, exemption);
        }


        return exemption;
    }

    public static calcEmployeeUnemploymentInsuranceExemption(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        employeeType: EmployeeType,
        isPensioner: boolean,
        workedDays: number,
        constants: CalculationConstants,
        employeeUnemploymentInsuranceDeduction: number
    ): number {
        let exemption = 0;
        if (!employeeType.unemploymentInsuranceApplicable || isPensioner) {
            return exemption;
        }

        if (employeeType.SGKMinWageBasedExemption) {
            exemption = minGrossWage.amount
                * constants.employee.unemploymentInsuranceRate
                * workedDays / constants.monthDayCount;
        } else if (employeeType.SGKMinWageBased17103Exemption) {
            const totalSGKRate = this.calcTotalSGKRate(constants);
            exemption = (minGrossWage.amount / totalSGKRate) * constants.employee.unemploymentInsuranceRate
                * workedDays / constants.monthDayCount;
            exemption = Math.min(employeeUnemploymentInsuranceDeduction, exemption);
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

    public static calcNetSalary(
        grossSalary: number,
        SGKDeduction: number,
        employeeUnemploymentInsuranceDeduction: number,
        stampTax: number,
        employeeStampTaxExemption: number,
        employerStampTaxExemption: number,
        employeeIncomeTax: number,
        employeeIncomeTaxExemption: number,
        yearParams: YearDataModel,
    ): number {
        let stampTaxExemption = employeeStampTaxExemption;
        stampTaxExemption += yearParams.minWageEmployeeTaxExemption ? employerStampTaxExemption : 0;
        return grossSalary + stampTaxExemption + employeeIncomeTaxExemption
            - (SGKDeduction + employeeUnemploymentInsuranceDeduction + stampTax + employeeIncomeTax);
    }

    public static calcEmployerSGKDeduction(isPensioner: boolean,
                                           employeeType: EmployeeType,
                                           constants: CalculationConstants,
                                           SGKBase: number
    ) {
        if (!employeeType.employerSGKApplicable) {
            return 0;
        }

        const rate = isPensioner ? constants.employer.SGDPDeductionRate : constants.employer.SGKDeductionRate;

        return SGKBase * rate;
    }

    public static calcEmployerSGKExemption(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        employeeType: EmployeeType,
        constants: CalculationConstants,
        SGKBase: number,
        isPensioner: boolean,
        applyEmployerDiscount5746: boolean,
        workedDays: number,
        researchAndDevelopmentWorkedDays: number,
        employerSGKDeduction: number
    ): number {
        let exemption = 0;
        if (!employeeType.employerSGKApplicable || isPensioner) {
            return exemption;
        }

        if (applyEmployerDiscount5746 && employeeType.employerSGKDiscount5746Applicable) {
            exemption += SGKBase * constants.employer.employerDiscount5746;
        }

        if (employeeType.employer5746AdditionalDiscountApplicable) {
            if (applyEmployerDiscount5746 && employeeType.employerSGKDiscount5746Applicable) {
                exemption += SGKBase
                    * (researchAndDevelopmentWorkedDays / workedDays)
                    * (constants.employer.SGKDeductionRate - constants.employer.employerDiscount5746)
                    * constants.employer.SGK5746AdditionalDiscount;
            } else {
                exemption += SGKBase * (researchAndDevelopmentWorkedDays / workedDays) *
                    constants.employer.SGKDeductionRate * constants.employer.SGK5746AdditionalDiscount;
            }
        } else if (employeeType.SGKMinWageBasedExemption) {
            const minWageSGKBase = MonthCalculationModel.calcGrossSalary(minGrossWage.amount, workedDays, constants.monthDayCount);
            exemption = MonthCalculationModel.calcEmployerSGKDeduction(isPensioner, employeeType, constants, minWageSGKBase);
        } else if (employeeType.SGKMinWageBased17103Exemption) {
            const totalSGKRate = this.calcTotalSGKRate(constants);
            const minWageSGKBase = MonthCalculationModel.calcGrossSalary(minGrossWage.amount / totalSGKRate,
                workedDays, constants.monthDayCount);
            exemption = MonthCalculationModel.calcEmployerSGKDeduction(isPensioner, employeeType, constants, minWageSGKBase);
            exemption = Math.min(employerSGKDeduction, exemption);
        } else if (employeeType.employerSGKShareTotalExemption) {
            exemption += employerSGKDeduction;
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

    public static calcEmployerUnemploymentInsuranceExemption(
        minGrossWage: MinGrossWage,
        employeeType: EmployeeType,
        constants: CalculationConstants,
        SGKBase: number,
        workedDays: number,
        isPensioner: boolean,
        employerUnemploymentInsuranceDeduction: number
    ) {
        let exemption = 0;
        if (!employeeType.employerUnemploymentInsuranceApplicable || isPensioner) {
            return exemption;
        }
        if (employeeType.SGKMinWageBasedExemption) {
            exemption = minGrossWage.amount
                * (workedDays / constants.monthDayCount)
                * constants.employer.unemploymentInsuranceRate;
        } else if (employeeType.SGKMinWageBased17103Exemption) {
            const totalSGKRate = this.calcTotalSGKRate(constants);
            const minWageSGKBase = MonthCalculationModel.calcGrossSalary(minGrossWage.amount / totalSGKRate,
                workedDays, constants.monthDayCount);
            exemption = MonthCalculationModel.calcEmployerUnemploymentInsuranceDeduction(isPensioner,
                employeeType, constants, minWageSGKBase);
            exemption = Math.min(employerUnemploymentInsuranceDeduction, exemption);
        }
        return exemption;
    }

    public static calcAGI(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        AGIRate: number,
        employeeType: EmployeeType,
        employeeTax: number,
        isAGICalculationEnabled: boolean,
    ) {
        if (!isAGICalculationEnabled || !employeeType.AGIApplicable || yearParams.minWageEmployeeTaxExemption) {
            return 0;
        }

        const agi = minGrossWage.amount * AGIRate * yearParams.taxSlices[0].rate;

        return Math.min(agi, employeeTax);
    }

    public static calcEmployeeIncomeTaxExemption(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        employeeType: EmployeeType,
        standardEmployeeType: EmployeeType,
        constants: CalculationConstants,
        employeeEduExemptionRate: number,
        isAGIIncludedTax: boolean,
        researchAndDevelopmentWorkedDays: number,
        employeeIncomeTax: number,
        AGIAmount: number,
        disabilityDegree: number,
        cumulativeIncomeTaxBase: number = 0,
        applyMinWageTaxExemption: boolean,
    ): number {

        let exemption = 0;

        if (applyMinWageTaxExemption && yearParams.minWageEmployeeTaxExemption) {
            if (employeeIncomeTax > 0) {
                const minWageBasedIncomeTax = MonthCalculationModel.calcEmployeeIncomeTaxOfTheGivenGrossSalary(
                    yearParams,
                    minGrossWage,
                    standardEmployeeType, constants, minGrossWage.amount,  constants.monthDayCount,
                    false, disabilityDegree, cumulativeIncomeTaxBase);

                exemption = Math.min(employeeIncomeTax, minWageBasedIncomeTax.tax);
            }
        }

        return exemption;
    }

    public static calcEmployerIncomeTaxExemption(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        employeeType: EmployeeType,
        constants: CalculationConstants,
        employeeEduExemptionRate: number,
        isAGIIncludedTax: boolean,
        workedDays: number,
        researchAndDevelopmentWorkedDays: number,
        employeeIncomeTax: number,
        AGIAmount: number,
        employeeIncomeTaxExemption: number,
        isPensioner: boolean,
        disabilityDegree: number,
        applyMinWageTaxExemption: boolean,
    ): number {

        let exemption = 0;
        if (!employeeType.employerIncomeTaxApplicable) {
            exemption = employeeIncomeTax;
        } else if (employeeType.employerEducationIncomeTaxExemption) {
            exemption = employeeEduExemptionRate * (employeeIncomeTax - AGIAmount - employeeIncomeTaxExemption)
                * (researchAndDevelopmentWorkedDays / workedDays);
        } else if (employeeType.researchAndDevelopmentTaxExemption) {
            exemption = (employeeIncomeTax - AGIAmount - employeeIncomeTaxExemption) * (researchAndDevelopmentWorkedDays / workedDays);
        } else if (applyMinWageTaxExemption && employeeType.taxMinWageBasedExemption && !yearParams.minWageEmployeeTaxExemption) {

            if ((employeeIncomeTax - AGIAmount) > 0) {
                const minWageBasedIncomeTax = MonthCalculationModel.calcEmployeeIncomeTaxOfTheGivenGrossSalary(
                    yearParams,
                    minGrossWage,
                    employeeType,
                    constants,
                    minGrossWage.amount,
                    workedDays,
                    isPensioner,
                    disabilityDegree
                );
                const minWageExemption = Math.max((minWageBasedIncomeTax.tax - AGIAmount), 0);
                exemption = Math.min(employeeIncomeTax - AGIAmount, minWageExemption);
            }
        }

        return exemption;
    }


    public static calcEmployeeIncomeTaxOfTheGivenGrossSalary(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        employeeType: EmployeeType,
        constants: CalculationConstants,
        grossSalary: number,
        workedDays: number,
        isPensioner: boolean,
        disabilityDegree: number,
        cumulativeIncomeTaxBase: number = 0
    ) {
        const incomeTaxBase = MonthCalculationModel.calcTaxBaseOfGivenGrossSalary(
            grossSalary,
            constants,
            yearParams,
            minGrossWage,
            workedDays,
            employeeType,
            isPensioner,
            disabilityDegree
        );

        return MonthCalculationModel.calcEmployeeIncomeTax(cumulativeIncomeTaxBase, yearParams, employeeType, incomeTaxBase);
    }

    public static calcTaxBaseOfGivenGrossSalary(
        grossSalary: number,
        constants: CalculationConstants,
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        workedDays: number,
        employeeType: EmployeeType,
        isPensioner: boolean,
        disabilityDegree: number
    ) {

        const taxBase = MonthCalculationModel.calcGrossSalary(grossSalary, workedDays, constants.monthDayCount);
        const SGKBase = MonthCalculationModel.calcSGKBase(minGrossWage, grossSalary, workedDays, constants.monthDayCount);

        const employeeSGKDeduction = MonthCalculationModel.calcEmployeeSGKDeduction(isPensioner, employeeType,
            constants, SGKBase);
        const employeeUnemploymentInsuranceDeduction = MonthCalculationModel.calcEmployeeUnemploymentInsuranceDeduction(
            isPensioner, employeeType, constants, SGKBase);
        const employeeDisabledIncomeTaxBaseAmount = MonthCalculationModel.calcDisabledIncomeTaxBaseAmount(yearParams,
            disabilityDegree, workedDays, constants.monthDayCount);

        return MonthCalculationModel.calcIncomeTaxBase(taxBase,
            employeeSGKDeduction,
            employeeUnemploymentInsuranceDeduction,
            employeeDisabledIncomeTaxBaseAmount);
    }

    private static calcEmployerStampTax(
        employeeType: EmployeeType,
        stampTax: number,
        stampTaxExemption: number
    ) {
        return employeeType.employerStampTaxApplicable ? stampTax - stampTaxExemption : 0;
    }

    constructor(parameters: any, standardEmployeeType: EmployeeType) {
        this._parameters = parameters;
        this._standardEmployeeType = standardEmployeeType;
        this.monthNumber = 1;
    }

    public calculate(calcMode: string, yearParams: YearDataModel,
                     enteredAmount: number, workedDays: number, researchAndDevelopmentWorkedDays: number, agiRate: number,
                     employeeType: EmployeeType, employeeEduExemptionRate: number,
                     applyEmployerDiscount5746: boolean, isAGIIncludedNet: boolean, isAGIIncludedTax: boolean,
                     isPensioner: boolean, disabilityDegree: number, isAGICalculationEnabled: boolean = true,
                     applyMinWageTaxExemption: boolean
    ) {
        this._workedDays = workedDays;
        this._researchAndDevelopmentWorkedDays = researchAndDevelopmentWorkedDays;
        if (!(enteredAmount > 0 && workedDays > 0)) {
            this.resetFields();
            return;
        }
        if (employeeType.researchAndDevelopmentTaxExemption && researchAndDevelopmentWorkedDays > workedDays) {
            throw new Error("Ar-Ge çalışma günü normal çalışma günden fazla olamaz");
        }

        let grossSalary;
        if (calcMode === "GROSS_TO_NET") {
            grossSalary = enteredAmount;
        } else if (calcMode === "TOTAL_TO_GROSS") {
            grossSalary = this.findGrossFromTotalCost(yearParams, enteredAmount, this._parameters.monthDayCount,
                researchAndDevelopmentWorkedDays, agiRate, employeeType, employeeEduExemptionRate,
                applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, disabilityDegree, isAGICalculationEnabled,
                applyMinWageTaxExemption
                );
        } else {
            grossSalary = this.findGrossFromNet(yearParams, enteredAmount, workedDays, this._parameters,
                researchAndDevelopmentWorkedDays, agiRate, employeeType, employeeEduExemptionRate,
                applyEmployerDiscount5746, isAGIIncludedNet, isAGIIncludedTax, isPensioner, disabilityDegree,
                isAGICalculationEnabled, applyMinWageTaxExemption
            );
        }
        if (grossSalary === -1) {
            this.resetFields();
            throw new Error("hesaplama başarısız");
        }

        grossSalary = Math.max(grossSalary, MonthCalculationModel.getMinGrossWage(yearParams, this.monthNumber).amount);

        this._calculate(yearParams, grossSalary, workedDays, researchAndDevelopmentWorkedDays,
            agiRate, employeeType, employeeEduExemptionRate, applyEmployerDiscount5746,
            isAGIIncludedTax, isPensioner, disabilityDegree, isAGICalculationEnabled,
            applyMinWageTaxExemption
            );
        return 0;
    }

    public resetFields() {
        this._grossSalaryForTaxBaseCalculation = 0;
        this._calculatedGrossSalary = 0;
        this._SGKBase = 0;
        this._employeeSGKDeduction = 0;
        this._employeeSGKExemptionAmount = 0;
        this._employeeUnemploymentInsuranceDeduction = 0;
        this._employeeUnemploymentInsuranceExemptionAmount = 0;
        this._employeeIncomeTax = 0;
        this._employerIncomeTaxExemptionAmount = 0;
        this._employeeIncomeTaxExemptionAmount = 0;
        this._employeeDisabledIncomeTaxBaseAmount = 0;

        this._employerUnemploymentInsuranceDeduction = 0;
        this._employerUnemploymentInsuranceExemptionAmount = 0;
        this._stampTax = 0;
        this._netSalary = 0;
        this._AGIAmount = 0;

        this._employerSGKDeduction = 0;
        this._employerSGKExemptionAmount = 0;
        this._employerStampTax = 0;
        this._employerStampTaxExemption = 0;
        this._employeeStampTaxExemption = 0;
        this._appliedTaxSlices = [];
    }

    private _calculate(
        yearParams: YearDataModel,
        grossSalary: number, workedDays: number, researchAndDevelopmentWorkedDays: number, agiRate: number,
        employeeType: EmployeeType, employeeEduExemptionRate: number,
        applyEmployerDiscount5746: boolean, isAGIIncludedTax: boolean,
        isPensioner: boolean, disabilityDegree: number, isAGICalculationEnabled: boolean,
        applyMinWageTaxExemption: boolean
    ) {

        const minGrossWage = MonthCalculationModel.getMinGrossWage(yearParams, this.monthNumber);

        this._grossSalaryForTaxBaseCalculation = Math.min(minGrossWage.amount, grossSalary);
        const cumIncomeTaxBase = this._previousMonth ? this._previousMonth.cumulativeIncomeTaxBase : 0;
        const cumulativeMinWageIncomeTaxBase = this._previousMonth ? this._previousMonth.cumulativeMinWageIncomeTaxBase(
            yearParams,
            minGrossWage,
            this._parameters,
            this._standardEmployeeType,
            isPensioner,
            disabilityDegree
        ) : 0;
        // some calculations are depend on others, so the order of execution matters
        this._calculatedGrossSalary = MonthCalculationModel.calcGrossSalary(grossSalary, workedDays, this._parameters.monthDayCount);

        this._SGKBase = MonthCalculationModel.calcSGKBase(minGrossWage, grossSalary,
            workedDays, this._parameters.monthDayCount);

        this._employeeDisabledIncomeTaxBaseAmount = MonthCalculationModel.calcDisabledIncomeTaxBaseAmount(yearParams,
            disabilityDegree, workedDays, this._parameters.monthDayCount);

        this._employeeSGKDeduction = MonthCalculationModel.calcEmployeeSGKDeduction(isPensioner, employeeType,
            this._parameters, this.SGKBase);

        this._employeeSGKExemptionAmount = MonthCalculationModel.calcEmployeeSGKExemption(minGrossWage, employeeType,
            isPensioner,
            workedDays, this._parameters, this.employeeSGKDeduction);

        this._employeeUnemploymentInsuranceDeduction = MonthCalculationModel.calcEmployeeUnemploymentInsuranceDeduction(
            isPensioner, employeeType, this._parameters, this.SGKBase);

        this._employeeUnemploymentInsuranceExemptionAmount = MonthCalculationModel.calcEmployeeUnemploymentInsuranceExemption(
            yearParams,
            minGrossWage,
            employeeType,
            isPensioner,
            workedDays, this._parameters, this.employeeUnemploymentInsuranceDeduction);

        this._stampTax = MonthCalculationModel.calcStampTax(employeeType, this._parameters, yearParams, this.calculatedGrossSalary);

        this._employeeStampTaxExemption = MonthCalculationModel.calcEmployeeStampTaxExemption(yearParams,
            minGrossWage,
            this._stampTax, employeeType,
            this._standardEmployeeType,
            this._parameters, grossSalary, workedDays, researchAndDevelopmentWorkedDays, applyMinWageTaxExemption);
        this._employerStampTaxExemption = MonthCalculationModel.calcEmployerStampTaxExemption(yearParams,
            minGrossWage,
            this._stampTax, employeeType,
            this._parameters, workedDays, researchAndDevelopmentWorkedDays, this._employeeStampTaxExemption);


        this._employerStampTax = MonthCalculationModel.calcEmployerStampTax(employeeType,
            this._stampTax, this.totalStampTaxExemption);
        const incomeTaxResult = MonthCalculationModel.calcEmployeeIncomeTax(cumIncomeTaxBase, yearParams, employeeType, this.incomeTaxBase);
        this._employeeIncomeTax = incomeTaxResult.tax;
        this._appliedTaxSlices = incomeTaxResult.appliedTaxSlices;

        this._employeeIncomeTaxExemptionAmount = MonthCalculationModel.calcEmployeeIncomeTaxExemption(
            yearParams,
            minGrossWage,
            employeeType,
            this._standardEmployeeType, this._parameters, employeeEduExemptionRate, isAGIIncludedTax,
            researchAndDevelopmentWorkedDays, this.employeeIncomeTax, 0, disabilityDegree,
            cumulativeMinWageIncomeTaxBase,
            applyMinWageTaxExemption
        );

        this._AGIAmount = MonthCalculationModel.calcAGI(yearParams,
            minGrossWage,
            agiRate, employeeType, this.employeeIncomeTax, isAGICalculationEnabled);

        this._netSalary = MonthCalculationModel.calcNetSalary(this.calculatedGrossSalary, this.employeeSGKDeduction,
            this.employeeUnemploymentInsuranceDeduction, this.stampTax, this.employeeStampTaxExemption,
            this.employerStampTaxExemption,
            this.employeeIncomeTax, this.employeeIncomeTaxExemptionAmount,
            yearParams,
        );

        this._employerSGKDeduction = MonthCalculationModel.calcEmployerSGKDeduction(isPensioner,
            employeeType, this._parameters, this.SGKBase);

        this._employerSGKExemptionAmount = MonthCalculationModel.calcEmployerSGKExemption(
            yearParams,
            minGrossWage,
            employeeType,
            this._parameters, this.SGKBase, isPensioner, applyEmployerDiscount5746,
            workedDays, researchAndDevelopmentWorkedDays, this.employerSGKDeduction);

        this._employerUnemploymentInsuranceDeduction = MonthCalculationModel.calcEmployerUnemploymentInsuranceDeduction(
            isPensioner, employeeType, this._parameters, this.SGKBase);

        this._employerUnemploymentInsuranceExemptionAmount = MonthCalculationModel.calcEmployerUnemploymentInsuranceExemption(
            minGrossWage,
            employeeType, this._parameters, this.SGKBase, workedDays, isPensioner, this.employerUnemploymentInsuranceDeduction);

        this._AGIAmount = MonthCalculationModel.calcAGI(
            yearParams,
            minGrossWage,
            agiRate, employeeType, this.employeeIncomeTax, isAGICalculationEnabled
        );

        this._employerIncomeTaxExemptionAmount = MonthCalculationModel.calcEmployerIncomeTaxExemption(
            yearParams,
            minGrossWage,
            employeeType,
            this._parameters, employeeEduExemptionRate, isAGIIncludedTax, workedDays,
            researchAndDevelopmentWorkedDays, this.employeeIncomeTax, this.AGIAmount,
            this._employeeIncomeTaxExemptionAmount, isPensioner, disabilityDegree, applyMinWageTaxExemption);
    }

    /**
     * @summary finds equivalent gross salary from the entered net amount using binary search
     * @returns gross salary
     */
    private findGrossFromNet(
        yearParams: YearDataModel,
        enteredAmount: number,
        workedDays: number,
        constants: CalculationConstants,
        researchAndDevelopmentWorkedDays: number,
        agiRate: number,
        employeeType: EmployeeType,
        employeeEduExemptionRate: number,
        applyEmployerDiscount5746: boolean,
        isAGIIncludedNet: boolean,
        isAGIIncludedTax: boolean,
        isPensioner: boolean,
        disabilityDegree: number,
        isAGICalculationEnabled: boolean,
        applyMinWageTaxExemption: boolean,
    ) {
        enteredAmount = enteredAmount * (workedDays / constants.monthDayCount);
        let left = enteredAmount / 30;
        let right = 30 * enteredAmount;
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
                applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, disabilityDegree, isAGICalculationEnabled,
                applyMinWageTaxExemption
            );
            calcNetSalary = isAGIIncludedNet ? this.netSalary + this.AGIAmount : this.netSalary;
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
    private findGrossFromTotalCost(
        yearParams: YearDataModel,
        enteredAmount: number,
        workedDays: number,
        researchAndDevelopmentWorkedDays: number,
        agiRate: number,
        employeeType: EmployeeType,
        employeeEduExemptionRate: number,
        applyEmployerDiscount5746: boolean,
        isAGIIncludedTax: boolean,
        isPensioner: boolean,
        disabilityDegree: number,
        isAGICalculationEnabled: boolean,
        applyMinWageTaxExemption: boolean,
    ) {

        let left = 0;
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
                employeeEduExemptionRate, applyEmployerDiscount5746, isAGIIncludedTax,
                isPensioner, disabilityDegree, isAGICalculationEnabled, applyMinWageTaxExemption);
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

    get workedDays(): number {
        return this._workedDays;
    }

    get researchAndDevelopmentWorkedDays(): number {
        return this._researchAndDevelopmentWorkedDays;
    }

    public get employerIncomeTaxExemptionAmount(): number {
        return this._employerIncomeTaxExemptionAmount;
    }

    public get cumulativeSalary(): number {
        if (this._previousMonth) {
            return this.calculatedGrossSalary + this._previousMonth.cumulativeSalary;
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
            return this.incomeTaxBase + this._previousMonth.cumulativeIncomeTaxBase;
        }
        return this.incomeTaxBase;
    }

    public calcMinWageIncomeTaxBase(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        employeeType: EmployeeType,
        constants: CalculationConstants,
        isPensioner: boolean,
        disabilityDegree: number
    ) {
        return MonthCalculationModel.calcTaxBaseOfGivenGrossSalary(
            this._grossSalaryForTaxBaseCalculation,
            constants,
            yearParams,
            minGrossWage,
            constants.monthDayCount,
            employeeType, isPensioner, disabilityDegree
        );
    }

    public cumulativeMinWageIncomeTaxBase(
        yearParams: YearDataModel,
        minGrossWage: MinGrossWage,
        constants: CalculationConstants,
        employeeType: EmployeeType,
        isPensioner: boolean,
        disabilityDegree: number
    ) {
        if (this._previousMonth) {
            return this.calcMinWageIncomeTaxBase(yearParams, minGrossWage, employeeType, constants, isPensioner, disabilityDegree)
                + this._previousMonth.cumulativeMinWageIncomeTaxBase(
                    yearParams,
                    minGrossWage,
                    constants,
                    employeeType,
                    isPensioner,
                    disabilityDegree
                );
        }
        return this.calcMinWageIncomeTaxBase(yearParams, minGrossWage, employeeType, constants, isPensioner, disabilityDegree);
    }


    public get employerFinalIncomeTax() {
        return this.employeeIncomeTax - this.employerIncomeTaxExemptionAmount - this.employeeIncomeTaxExemptionAmount - this.AGIAmount;
    }

    public get appliedTaxSlicesAsString() {
        return this.appliedTaxSlices.map(o => o.rate * 100).join("-");
    }

    public get finalNetSalary() {
        return this.netSalary + this.AGIAmount;
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

    public get totalStampTaxExemption(): number {
        return this._employerStampTaxExemption + this._employeeStampTaxExemption;
    }

    public get AGIAmount(): number {
        return this._AGIAmount;
    }

    public get employerStampTax() {
        return this._employerStampTax;
    }

    public get employerTotalSGKCost() {
        return this.employeeFinalSGKDeduction + this.employeeFinalUnemploymentInsuranceDeduction
            + this.employerFinalSGKDeduction + this.employerFinalUnemploymentInsuranceDeduction;
    }

    public get employerTotalCost() {
        return this.netSalary + this.AGIAmount + this.employerTotalSGKCost + this.employerStampTax +
            this.employerFinalIncomeTax;
    }

    public get totalSGKExemption() {
        return this.employerSGKExemption + this.employerUnemploymentInsuranceExemption
            + this.employeeSGKExemption + this.employeeUnemploymentInsuranceExemption;
    }

    public get appliedTaxSlices(): TaxSliceModel[] {
        return this._appliedTaxSlices;
    }

    get employeeIncomeTaxExemptionAmount(): number {
        return this._employeeIncomeTaxExemptionAmount;
    }

    get employeeStampTaxExemption(): number {
        return this._employeeStampTaxExemption;
    }

    get employeeMinWageTaxExemptionAmount(): number {
        return this._employeeIncomeTaxExemptionAmount + this._employeeStampTaxExemption;
    }
}
