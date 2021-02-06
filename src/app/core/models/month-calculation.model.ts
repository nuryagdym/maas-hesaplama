import { YearDataModel } from './year-data.model';

export class MonthCalculationModel {
    monthName: string;
    private _previousMonth: MonthCalculationModel;
    private _employeeDisabledIncomeTaxBaseAmount: number;
    private _employerIncomeTaxExcemptionAmount: number;

    private _calculatedGrossSalary: number;
    private _employeeSGKDeduction: number;
    private _employeeUnemploymentInsuranceDeduction: number;
    private _employeeIncomeTax: number;
    private _stampTax: number;
    private _netSalary: number;

    private _employerStampTax: number;
    private _employerSGKDeduction: number;
    private _employerUnemploymentInsuranceDeduction: number;
    private _employerAGIamount: number;

    private _AGIamount: number;

    private _appliedTaxSlices: {
        rate: number;
        ceil: number;
    }[] = [];

    private _parameters;

    constructor(parameters: any){
        this._parameters = parameters;
    }

    public calculate(calcMode: string, yearParams: YearDataModel,
        enteredAmount: number, workedDays: number, agiRate: number,
        employeeType: object, employeeEduExcemptionRate: number,
        applyEmployerDiscount5746: boolean, isAGIIncludedNet: boolean, isAGIIncludedTax: boolean,
        isPensioner: boolean, isEmployer: boolean, disabilityDegree: number
        ) {
        if(!(enteredAmount > 0 && workedDays > 0)){
            this.resetFields();
            return;
        }
        let grossSalary;
        if(calcMode === 'GROSS_TO_NET'){
            grossSalary = enteredAmount;
        }else if(calcMode === 'TOTAL_TO_GROSS'){
            grossSalary = this.findGrossFromTotalCost(yearParams, enteredAmount, workedDays, agiRate, employeeType, employeeEduExcemptionRate, applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, isEmployer, disabilityDegree);
        }else{
            grossSalary = this.findGrossFromNet(yearParams, enteredAmount, workedDays, agiRate, employeeType, employeeEduExcemptionRate, applyEmployerDiscount5746, isAGIIncludedNet, isAGIIncludedTax, isPensioner, isEmployer, disabilityDegree);
        }
        if(grossSalary === -1) {
            this.resetFields();
            throw "hesaplama başarısız";
        }
        if(grossSalary < yearParams.minGrossWage){
            grossSalary = yearParams.minGrossWage;
        }

        this._calculate(yearParams, grossSalary, workedDays, agiRate, employeeType, employeeEduExcemptionRate, applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, isEmployer, disabilityDegree);
        return 0;
    }

    public resetFields(){
        this._calculatedGrossSalary = 0;
        this._employeeSGKDeduction = 0;
        this._employeeUnemploymentInsuranceDeduction = 0;
        this._employeeIncomeTax = 0;

        this._employerUnemploymentInsuranceDeduction = 0;
        this._stampTax = 0;
        this._netSalary = 0;
        this._AGIamount = 0;

        this._employerSGKDeduction = 0;
        this._employerStampTax = 0;
        this._appliedTaxSlices = [];
    }

    private _calculate(yearParams: YearDataModel,
        grossSalary: number, workedDays: number, agiRate: number,
        employeeType: object, employeeEduExcemptionRate: number,
        applyEmployerDiscount5746: boolean, isAGIIncludedTax: boolean,
        isPensioner: boolean, isEmployer: boolean, disabilityDegree: number) {

        const cumIncomeTaxBase = this._previousMonth ? this._previousMonth.cumulativeIncomeTaxBase: 0;

        // some calculations are depended to others, so the order of execution matters
        this.calcGrossSalary(grossSalary, workedDays);
        this.calcDisabledIncomeTaxBaseAmount(yearParams, disabilityDegree, workedDays);
        this.calcEmployeeSGKDeduction(yearParams, isPensioner, isEmployer);
        this.calcEmployeeUnemploymentInsuranceDeduction(yearParams, isPensioner, isEmployer);
        this.calcStampTax(employeeType);
        this.calcEmployerStampTax(employeeType);
        this.calcEmployeeIncomeTax(cumIncomeTaxBase, yearParams, employeeType);

        this.calcNetSalary();

        this.calcEmployerSGKDeduction(yearParams, isPensioner, isEmployer, applyEmployerDiscount5746, employeeType);
        this.calcEmployerUnemploymentInsuranceDeduction(yearParams, isPensioner, isEmployer);

        this.calcAGI(yearParams, agiRate, employeeType, workedDays, grossSalary);
        this.calcEmployerAGI(employeeType);

        this.calcEmployerIncomeTaxExemption(employeeType, employeeEduExcemptionRate, isAGIIncludedTax);
    }

    private calcNetSalary() {
        this._netSalary = this.calculatedGrossSalary - (this.employeeSGKDeduction +
            this.employeeUnemploymentInsuranceDeduction + this.stampTax + this.employeeIncomeTax);
    }


    private calcEmployeeSGKDeduction(yearParams: YearDataModel, isPensioner: boolean, isEmployer: boolean) {
        let rate = 0;
        if (isEmployer) {
            rate = this._parameters.employee.SGKEmployerDeductionRate;
        } else if (isPensioner) {
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

    private calcEmployerSGKDeduction(yearParams: YearDataModel, isPensioner: boolean, isEmployer: boolean,
                                     applyEmployerDiscount5746: boolean, employeeType: any) {
        if (!employeeType.employerSGKApplicable) {
            this._employerSGKDeduction = 0;
            return;
        }
        let rate;
        if (isEmployer) {
            rate = this._parameters.employer.SGKEmployerDeductionRate;
        } else if (isPensioner) {
            rate = this._parameters.employer.SGDPDeductionRate;
        } else {
            rate = this._parameters.employer.SGKDeductionRate;
        }
        if (!isPensioner) {
            if (rate > 0 && applyEmployerDiscount5746) {
                rate -= this._parameters.employer.employerDiscount5746;
            }
            if (employeeType.employer5746AdditionalDiscountApplicable) {
                rate *= this._parameters.employer.SGK5746AdditionalDiscount;
            }
        }

        this._employerSGKDeduction = this.calculatedGrossSalary < yearParams.SGKCeil ? this.calculatedGrossSalary * rate : yearParams.SGKCeil * rate;
    }

    private calcEmployeeUnemploymentInsuranceDeduction(yearParams: YearDataModel, isPensioner: boolean, isEmployer: boolean) {
        let rate = 0;
        if (isEmployer) {
            rate = this._parameters.employee.employerUnemploymentInsuranceRate;
        } else if (isPensioner) {
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

    private calcEmployerUnemploymentInsuranceDeduction(yearParams: YearDataModel, isPensioner: boolean, isEmployer: boolean) {
        let rate = 0;
        if (isEmployer) {
            rate = this._parameters.employer.employerUnemploymentInsuranceRate;
        } else if (isPensioner) {
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

    private calcEmployeeIncomeTax(cumulativeSalary: number, yearParams: YearDataModel, employeeType: any) {
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


    private calcStampTax(employeeType: any) {
        if (!employeeType.stampTaxApplicable) {
            this._stampTax = 0;
            return;
        }

        this._stampTax = (this.calculatedGrossSalary * this._parameters.stampTaxRate);
    }

    private calcEmployerStampTax(employeeType: any){
        this._employerStampTax = employeeType.employerStampTaxApplicable ? this._stampTax : 0;
    }

    private calcAGI(yearParams: YearDataModel, AGIRate: number, employeeType: any, workedDays: number, grossSalary: number) {
        if (employeeType.AGIApplicable) {
            let minWage = yearParams.minGrossWage * workedDays / this._parameters.monthDayCount;
            if(grossSalary < minWage) minWage = grossSalary;
            this._AGIamount = minWage * AGIRate * yearParams.taxSlices[0].rate;
        }else{
            this._AGIamount = 0;
        }
    }

    private calcEmployerAGI(employeeType: any) {
        this._employerAGIamount = employeeType.employerAGIApplicable ? this._AGIamount : 0
    }

    private calcGrossSalary(grossSalary: number, dayCount: number) {

        this._calculatedGrossSalary = grossSalary * dayCount / this._parameters.monthDayCount;
    }

    private calcDisabledIncomeTaxBaseAmount(yearParams: YearDataModel, disabilityDegree: number, workedDays: number) {
        const disability = yearParams.disabledMonthlyIncomeTaxDiscountBases.find(option => option.degree == disabilityDegree);
        if(!disability){
            this._employeeDisabledIncomeTaxBaseAmount = 0;
        }else{
            this._employeeDisabledIncomeTaxBaseAmount = disability.amount * workedDays / this._parameters.monthDayCount;
        }
    }

    private calcEmployerIncomeTaxExemption(employeeType: any, employeeEduExemptionRate: number, isAGIIncludedTax: boolean) {
        console.log("calcEmployerIncomeTaxExemption isAGIIncludedTax", isAGIIncludedTax);
        let exemption = 0;
        if (employeeType.employerIncomeTaxApplicable === false) {
          exemption = this.employeeIncomeTax;
        } else if (employeeType.employerEducationIncomeTaxExcemption) {
          exemption = employeeEduExemptionRate * (this.employeeIncomeTax - this.AGIamount) + this.AGIamount;
        }

        if (employeeType.employerIncomeTaxApplicable && isAGIIncludedTax) {
            console.log("calcEmployerIncomeTaxExemption exemption", exemption);
            console.log("calcEmployerIncomeTaxExemption AGIamount", this.AGIamount);
            exemption += this.AGIamount;
        }
        this._employerIncomeTaxExcemptionAmount = exemption;
    }

    /**
     *
     * @param yearParams
     * @param enteredAmount
     * @param workedDays
     * @param agiRate
     * @param employeeType
     * @param employeeEduExcemptionRate
     * @param applyEmployerDiscount5746
     * @param isAGIIncludedNet
     * @param isPensioner
     * @param isEmployer
     * @param disabilityDegree
     *
     * @summary finds equivalent gross salary from the entered net amount using binary search
     * @returns gross salary
     */
    private findGrossFromNet(yearParams: YearDataModel,
        enteredAmount: number, workedDays: number, agiRate: number,
        employeeType: object, employeeEduExcemptionRate: number,
        applyEmployerDiscount5746: boolean, isAGIIncludedNet: boolean,
                             isAGIIncludedTax: boolean,
        isPensioner: boolean, isEmployer: boolean, disabilityDegree: number){

            let left = enteredAmount;
            let right = 3 * enteredAmount;
            let middle = (right + left) / 2
            let itLimit = 100;
            let calcNetSalary = null;
            for (let i = 0; i < itLimit && calcNetSalary != enteredAmount; i++){

                //could not find
                if(right < left) return -1;

                this._calculate(yearParams, middle, workedDays, agiRate, employeeType, employeeEduExcemptionRate, applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, isEmployer, disabilityDegree);
                calcNetSalary = isAGIIncludedNet ? this.netSalary + this.AGIamount : this.netSalary;
                if(calcNetSalary > enteredAmount){
                    right = middle;
                }else{
                    left = middle;
                }
                middle = (right + left) / 2;
            }
            return middle;
    }

    /**
     *
     * @param yearParams
     * @param enteredAmount
     * @param workedDays
     * @param agiRate
     * @param employeeType
     * @param employeeEduExcemptionRate
     * @param applyEmployerDiscount5746
     * @param isPensioner
     * @param isEmployer
     * @param disabilityDegree
     *
     * @summary finds equivalent gross salary from the entered total cost amount using binary search
     * @returns gross Salary
     */
    private findGrossFromTotalCost(yearParams: YearDataModel,
        enteredAmount: number, workedDays: number, agiRate: number,
        employeeType: object, employeeEduExcemptionRate: number,
        applyEmployerDiscount5746: boolean, isAGIIncludedTax: boolean,
        isPensioner: boolean, isEmployer: boolean, disabilityDegree: number){

            let left = enteredAmount / 3;
            let right = enteredAmount;
            let middle = (right + left) / 2
            let itLimit = 100;
            let calcTotalCost = null;

            for (let i = 0, o = 0, n = 0; i < itLimit && calcTotalCost != enteredAmount; i++){

                if(right < left) return -1;

                this._calculate(yearParams, middle, workedDays, agiRate, employeeType, employeeEduExcemptionRate, applyEmployerDiscount5746, isAGIIncludedTax, isPensioner, isEmployer, disabilityDegree);
                calcTotalCost = this.employerTotalCost;
                if(calcTotalCost > enteredAmount){
                    right = middle;
                }else{
                    left = middle;
                }
                middle = (right + left) / 2;
            }
            return middle;
    }

    set previousMonth(month: MonthCalculationModel){
        this._previousMonth = month;
    }

    public get employerIncomeTaxExcemptionAmount(): number {
        return this._employerIncomeTaxExcemptionAmount;
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
    public get employerFinalIncomeTax(){
        return this.employeeIncomeTax - this.employerIncomeTaxExcemptionAmount;
    }

    public get appliedTaxSlicesAsString(){
        return this.appliedTaxSlices.map(o => o.rate * 100).join('-');
    }

    public get finalNetSalary(){
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

    public get AGIamount(): number {
        return this._AGIamount;
    }

    public get employerStampTax(){
        return this._employerStampTax;
    }

    public get employerTotalSGKCost(){
        return this.employeeSGKDeduction + this.employeeUnemploymentInsuranceDeduction +
        + this.employerSGKDeduction + this.employerUnemploymentInsuranceDeduction;
    }

    public get employerTotalCost() {
        return this.netSalary + this.employerAGIAmount + this.employerTotalSGKCost + this.employerStampTax +
         this.employerFinalIncomeTax;
    }

    public get employerAGIAmount(){
        return this._employerAGIamount;
    }

    public get appliedTaxSlices(): {
        rate: number;
        ceil: number;
    }[] {
        return this._appliedTaxSlices;
    }

}
