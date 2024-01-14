import {MonthCalculationModel} from "./month-calculation.model";
import {YearDataModel} from "./year-data.model";
import {AGIOption, DisabilityOption, EmployeeEducationType, EmployeeType} from "../services/parameters.service";

export class YearCalculationModel {

    private _year: YearDataModel | undefined;
    private readonly _months: MonthCalculationModel[] = [];
    private _enteredAmounts: number[] = [];
    private _workedDays: number[] = [];
    private _researchAndDevelopmentWorkedDays: number[] = [];

    private _calcMode: string = 'GROSS_TO_NET';
    private _isPensioner: boolean = false;
    private _isAGIIncludedNet: boolean = false;
    private _isAGIIncludedTax: boolean = true;
    private _applyMinWageTaxExemption: boolean = true;
    private _applyEmployerDiscount5746: boolean = false;
    private _AGI: AGIOption | undefined;
    private _employeeType: EmployeeType | undefined;
    private _employeeEduType: EmployeeEducationType | undefined;
    private _employeeDisability: DisabilityOption | undefined;
    private _numOfCalculatedMonths: number = 0;
    private _isAGICalculationEnabled: boolean = true;

    private readonly _parameters: any;

    constructor(months: string[], salaryConstants: any, standardEmployeeType: EmployeeType) {

        this._parameters = salaryConstants;

        let previousMonth: MonthCalculationModel | undefined = undefined;
        let i = 1;
        for (const m of months) {
            const month = new MonthCalculationModel(this._parameters, standardEmployeeType);
            month.monthName = m;
            month.monthNumber = i;
            month.previousMonth = previousMonth;
            previousMonth = month;
            this._months.push(month);
            i++;
        }
    }

    set year(y: YearDataModel) {
        this._year = y;
    }

    static get calculationModes() {
        return {
            labelText: "Hesaplama Şekli",
            options: [
                {
                    id: "GROSS_TO_NET",
                    text: "Brütten Nete"
                },
                {
                    id: "NET_TO_GROSS",
                    text: "Netten Brüte"
                },
                {
                    id: "TOTAL_TO_GROSS",
                    text: "Toplam Maliyete Göre"
                }
            ]
        };
    }

    set calculationMode(modeId: string) {
        this._calcMode = modeId;
    }

    set isPensioner(is: boolean) {
        this._isPensioner = is;
    }

    set isAGIIncludedNet(is: boolean) {
        this._isAGIIncludedNet = is;
    }

    set AGI(agi: AGIOption) {
        this._AGI = agi;
    }

    get employeeType(): EmployeeType | undefined {
        return this._employeeType;
    }

    set employeeType(type: EmployeeType) {
        this._employeeType = type;
    }

    set employeeEduType(type: EmployeeEducationType) {
        this._employeeEduType = type;
    }

    set employerDiscount5746(apply: boolean) {
        this._applyEmployerDiscount5746 = apply;
    }

    set employeeDisability(d: DisabilityOption) {
        this._employeeDisability = d;
    }

    set enteredAmounts(amounts: number[]) {
        this._enteredAmounts = amounts;
    }

    set dayCounts(days: number[]) {
        this._workedDays = days;
    }

    get researchAndDevelopmentWorkedDays(): number[] {
        return this._researchAndDevelopmentWorkedDays;
    }

    set researchAndDevelopmentWorkedDays(value: number[]) {
        this._researchAndDevelopmentWorkedDays = value;
    }

    get isAGIIncludedTax(): boolean {
        return this._isAGIIncludedTax;
    }

    set isAGIIncludedTax(value: boolean) {
        this._isAGIIncludedTax = value;
    }

    get isAGICalculationEnabled(): boolean {
        return this._isAGICalculationEnabled;
    }

    set isAGICalculationEnabled(value: boolean) {
        this._isAGICalculationEnabled = value;
    }

    get applyMinWageTaxExemption(): boolean {
        return this._applyMinWageTaxExemption;
    }

    set applyMinWageTaxExemption(value: boolean) {
        this._applyMinWageTaxExemption = value;
    }

    calculate() {
        this._numOfCalculatedMonths = 0;
        this._months.forEach((m, i) => {
            if (
              undefined === this._year
              || undefined === this._AGI
              || undefined === this._employeeType
              || undefined === this._employeeEduType
              || undefined === this._employeeDisability
            ) {
              throw new Error('Year calculation parameters are not initialized');
            }
            m.calculate(this._calcMode, this._year, this._enteredAmounts[i],
                this._workedDays[i], this._researchAndDevelopmentWorkedDays[i],
                this._AGI.rate, this._employeeType, this._employeeEduType.exemptionRate,
                this._applyEmployerDiscount5746, this._isAGIIncludedNet, this._isAGIIncludedTax,
                this._isPensioner, this._employeeDisability.degree, this._isAGICalculationEnabled,
                this._applyMinWageTaxExemption
            );
            if (m.calculatedGrossSalary > 0) {
                this._numOfCalculatedMonths++;
            }
        });
    }

    get monthDayCount() {
        return this._parameters.monthDayCount;
    }

    get months(): MonthCalculationModel[] {
        return this._months;
    }

    get totalWorkDays(): number {
        const totalSum = this._months.reduce((total, month) => total + month.workedDays, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgWorkDays(): number {
        return this._numOfCalculatedMonths > 0 ? this.totalWorkDays / this._numOfCalculatedMonths : 0;
    }

    get totalResearchAndDevelopmentWorkedDays(): number {
        const totalSum = this._months.reduce((total, month) => total + month.researchAndDevelopmentWorkedDays, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgResearchAndDevelopmentWorkedDays(): number {
        return this._numOfCalculatedMonths > 0 ? this.totalResearchAndDevelopmentWorkedDays / this._numOfCalculatedMonths : 0;
    }

    get calculatedGrossSalary(): number {
        const totalSum = this._months.reduce((total, month) => total + month.calculatedGrossSalary, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgCalculatedGrossSalary(): number {
        return this._numOfCalculatedMonths > 0 ? this.calculatedGrossSalary / this._numOfCalculatedMonths : 0;
    }

    get employeeSGKDeduction(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employeeSGKDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeSGKDeduction(): number {
        return this._numOfCalculatedMonths > 0 ? this.employeeSGKDeduction / this._numOfCalculatedMonths : 0;
    }

    get employeeSGKExemption(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employeeSGKExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeSGKExemption(): number {
        return this._numOfCalculatedMonths > 0 ? this.employeeSGKExemption / this._numOfCalculatedMonths : 0;
    }

    get employeeFinalSGKDeduction(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employeeFinalSGKDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeFinalSGKDeduction(): number {
        return this._numOfCalculatedMonths > 0 ? this.employeeFinalSGKDeduction / this._numOfCalculatedMonths : 0;
    }

    get employeeUnemploymentInsuranceDeduction(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employeeUnemploymentInsuranceDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeUnemploymentInsuranceDeduction(): number {
        return this._numOfCalculatedMonths > 0 ? this.employeeUnemploymentInsuranceDeduction / this._numOfCalculatedMonths : 0;
    }

    get employeeUnemploymentInsuranceExemption(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employeeUnemploymentInsuranceExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeUnemploymentInsuranceExemption(): number {
        return this._numOfCalculatedMonths > 0 ? this.employeeUnemploymentInsuranceExemption / this._numOfCalculatedMonths : 0;
    }

    get employeeIncomeTax(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employeeIncomeTax, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeIncomeTax(): number {
        return this._numOfCalculatedMonths > 0 ? this.employeeIncomeTax / this._numOfCalculatedMonths : 0;
    }

    get stampTax(): number {
        const totalSum = this._months.reduce((total, month) => total + month.stampTax, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgStampTax(): number {
        return this._numOfCalculatedMonths > 0 ? this.stampTax / this._numOfCalculatedMonths : 0;
    }

    get employerStampTax(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerStampTax, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerStampTax(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerStampTax / this._numOfCalculatedMonths : 0;
    }

    get employerStampTaxExemption(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerStampTaxExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerStampTaxExemption(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerStampTaxExemption / this._numOfCalculatedMonths : 0;
    }

    get totalStampTaxExemption(): number {
        const totalSum = this._months.reduce((total, month) => total + month.totalStampTaxExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }
    get avgTotalStampTaxExemption(): number {
        return this._numOfCalculatedMonths > 0 ? this.totalStampTaxExemption / this._numOfCalculatedMonths : 0;
    }


    get netSalary(): number {
        const totalSum = this._months.reduce((total, month) => total + month.netSalary, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgNetSalary(): number {
        return this._numOfCalculatedMonths > 0 ? this.netSalary / this._numOfCalculatedMonths : 0;
    }

    get AGIAmount(): number {
        const totalSum = this._months.reduce((total, month) => total + month.AGIAmount, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgAGIAmount(): number {
        return this._numOfCalculatedMonths > 0 ? this.AGIAmount / this._numOfCalculatedMonths : 0;
    }

    get finalNetSalary(): number {
        const totalSum = this._months.reduce((total, month) => total + month.finalNetSalary, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgFinalNetSalary(): number {
        return this._numOfCalculatedMonths > 0 ? this.finalNetSalary / this._numOfCalculatedMonths : 0;
    }

    get employerSGKDeduction(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerSGKDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerSGKDeduction(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerSGKDeduction / this._numOfCalculatedMonths : 0;
    }

    get employerSGKExemption(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerSGKExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerSGKExemption(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerSGKExemption / this._numOfCalculatedMonths : 0;
    }

    get employerTotalSGKCost(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerTotalSGKCost, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerTotalSGKCost(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerTotalSGKCost / this._numOfCalculatedMonths : 0;
    }

    get employerUnemploymentInsuranceDeduction(): number {

        const totalSum = this._months.reduce((total, month) => total + month.employerUnemploymentInsuranceDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerUnemploymentInsuranceDeduction(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerUnemploymentInsuranceDeduction / this._numOfCalculatedMonths : 0;
    }

    get employerUnemploymentInsuranceExemption(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerUnemploymentInsuranceExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerUnemploymentInsuranceExemption(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerUnemploymentInsuranceExemption / this._numOfCalculatedMonths : 0;
    }

    get employerFinalIncomeTax(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerFinalIncomeTax, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get employerIncomeTaxExemptionAmount(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerIncomeTaxExemptionAmount, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerIncomeTaxExemptionAmount(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerIncomeTaxExemptionAmount / this._numOfCalculatedMonths : 0;
    }

    get employeeMinWageTaxExemptionAmount(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employeeMinWageTaxExemptionAmount, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeMinWageTaxExemptionAmount(): number {
        return this._numOfCalculatedMonths > 0 ? this.employeeMinWageTaxExemptionAmount / this._numOfCalculatedMonths : 0;
    }

    get avgEmployerFinalIncomeTax(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerFinalIncomeTax / this._numOfCalculatedMonths : 0;
    }

    get totalSGKExemption(): number {
        const totalSum = this._months.reduce((total, month) => total + month.totalSGKExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgTotalSGKExemption(): number {
        return this._numOfCalculatedMonths > 0 ? this.totalSGKExemption / this._numOfCalculatedMonths : 0;
    }

    get employerTotalCost(): number {
        const totalSum = this._months.reduce((total, month) => total + month.employerTotalCost, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }


    get avgEmployerTotalCost(): number {
        return this._numOfCalculatedMonths > 0 ? this.employerTotalCost / this._numOfCalculatedMonths : 0;
    }

    getSemesterWorkedDays(half: "first" | "second"): number {
        let l = 0;
        let r = this._months.length - 6;
        if (half === "second") {
            l = 6;
            r = this._months.length;
        }
        let workedDays = 0;
        for (let i = l; i < r; i++) {
            workedDays += this._months[i].workedDays;
        }
        return workedDays;
    }

    getSemesterTubitakAvgCost(half: "first" | "second"): number {
        return this.yearHalfEmployerAvgTotalCost(half, false) *  (this.monthDayCount * 6) / this.getSemesterWorkedDays(half);
    }

    employerHalfTotalCost(half: "first" | "second"): number {
        let l = 0;
        let r = this._months.length - 6;
        if (half === "second") {
            l = 6;
            r = this._months.length;
        }
        let total = 0;
        for (let i = l; i < r; i++) {
            total += this._months[i].employerTotalCost;
        }
        return isNaN(total) ? 0 : total;
    }

    yearHalfEmployerAvgTotalCost(half: "first" | "second", skipNonWorkedMonths = true) {
        let l = 0;
        let r = this._months.length - 6;
        if (half === "second") {
            l = 6;
            r = this._months.length;
        }
        let workedMonths = 0;
        for (let i = l; i < r; i++) {
            if (!skipNonWorkedMonths || this._months[i].calculatedGrossSalary > 0) {
                workedMonths++;
            }
        }
        if (workedMonths === 0) {
            return 0;
        }
        return this.employerHalfTotalCost(half) / workedMonths;
    }

}
