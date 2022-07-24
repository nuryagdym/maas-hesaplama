import {MonthCalculationModel} from "./month-calculation.model";
import {YearDataModel} from "./year-data.model";
import {EmployeeEducationType, EmployeeType} from "../services/parameters.service";

export class YearCalculationModel {

    private _year: YearDataModel;
    private readonly _months: MonthCalculationModel[];
    private _enteredAmounts: number[];
    private _workedDays: number[];
    private _researchAndDevelopmentWorkedDays: number[];

    private _calcMode: string;
    private _isPensioner: boolean;
    private _isAGIIncludedNet: boolean;
    private _isAGIIncludedTax: boolean;
    private _applyMinWageTaxExemption: boolean;
    private _applyEmployerDiscount5746: boolean;
    private _AGI: any;
    private _employeeType: EmployeeType;
    private _employeeEduType: EmployeeEducationType;
    private _employeeDisability: any;
    private _numOfCalculatedMonths: number;
    private _isAGICalculationEnabled: boolean;

    private readonly _parameters: any;

    constructor(months: string[], salaryConstants: any, standardEmployeeType: EmployeeType) {

        this._parameters = salaryConstants;
        this._isAGICalculationEnabled = true;

        this._months = [];
        let previousMonth: MonthCalculationModel = null;
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

    set AGI(agi: any) {
        this._AGI = agi;
    }

    get employeeType(): EmployeeType {
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

    set employeeDisability(d: any) {
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
        let result = 0;
        this._months.forEach((m, i) => {
            result = m.calculate(this._calcMode, this._year, this._enteredAmounts[i],
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

    get totalWorkDays() {
        const totalSum = this._months.reduce((total, month) => total + month.workedDays, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgWorkDays() {
        return this._numOfCalculatedMonths > 0 ? this.totalWorkDays / this._numOfCalculatedMonths : 0;
    }

    get totalResearchAndDevelopmentWorkedDays() {
        const totalSum = this._months.reduce((total, month) => total + month.researchAndDevelopmentWorkedDays, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgResearchAndDevelopmentWorkedDays() {
        return this._numOfCalculatedMonths > 0 ? this.totalResearchAndDevelopmentWorkedDays / this._numOfCalculatedMonths : 0;
    }

    get calculatedGrossSalary() {
        const totalSum = this._months.reduce((total, month) => total + month.calculatedGrossSalary, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgCalculatedGrossSalary() {
        return this._numOfCalculatedMonths > 0 ? this.calculatedGrossSalary / this._numOfCalculatedMonths : 0;
    }

    get employeeSGKDeduction() {
        const totalSum = this._months.reduce((total, month) => total + month.employeeSGKDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeSGKDeduction() {
        return this._numOfCalculatedMonths > 0 ? this.employeeSGKDeduction / this._numOfCalculatedMonths : 0;
    }

    get employeeSGKExemption() {
        const totalSum = this._months.reduce((total, month) => total + month.employeeSGKExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeSGKExemption() {
        return this._numOfCalculatedMonths > 0 ? this.employeeSGKExemption / this._numOfCalculatedMonths : 0;
    }

    get employeeFinalSGKDeduction() {
        const totalSum = this._months.reduce((total, month) => total + month.employeeFinalSGKDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeFinalSGKDeduction() {
        return this._numOfCalculatedMonths > 0 ? this.employeeFinalSGKDeduction / this._numOfCalculatedMonths : 0;
    }

    get employeeUnemploymentInsuranceDeduction() {
        const totalSum = this._months.reduce((total, month) => total + month.employeeUnemploymentInsuranceDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeUnemploymentInsuranceDeduction() {
        return this._numOfCalculatedMonths > 0 ? this.employeeUnemploymentInsuranceDeduction / this._numOfCalculatedMonths : 0;
    }

    get employeeUnemploymentInsuranceExemption() {
        const totalSum = this._months.reduce((total, month) => total + month.employeeUnemploymentInsuranceExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeUnemploymentInsuranceExemption() {
        return this._numOfCalculatedMonths > 0 ? this.employeeUnemploymentInsuranceExemption / this._numOfCalculatedMonths : 0;
    }

    get employeeIncomeTax() {
        const totalSum = this._months.reduce((total, month) => total + month.employeeIncomeTax, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeIncomeTax() {
        return this._numOfCalculatedMonths > 0 ? this.employeeIncomeTax / this._numOfCalculatedMonths : 0;
    }

    get stampTax() {
        const totalSum = this._months.reduce((total, month) => total + month.stampTax, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgStampTax() {
        return this._numOfCalculatedMonths > 0 ? this.stampTax / this._numOfCalculatedMonths : 0;
    }

    get employerStampTax() {
        const totalSum = this._months.reduce((total, month) => total + month.employerStampTax, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerStampTax() {
        return this._numOfCalculatedMonths > 0 ? this.employerStampTax / this._numOfCalculatedMonths : 0;
    }

    get employerStampTaxExemption() {
        const totalSum = this._months.reduce((total, month) => total + month.employerStampTaxExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerStampTaxExemption() {
        return this._numOfCalculatedMonths > 0 ? this.employerStampTaxExemption / this._numOfCalculatedMonths : 0;
    }

    get totalStampTaxExemption() {
        const totalSum = this._months.reduce((total, month) => total + month.totalStampTaxExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }
    get avgTotalStampTaxExemption() {
        return this._numOfCalculatedMonths > 0 ? this.totalStampTaxExemption / this._numOfCalculatedMonths : 0;
    }


    get netSalary() {
        const totalSum = this._months.reduce((total, month) => total + month.netSalary, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgNetSalary() {
        return this._numOfCalculatedMonths > 0 ? this.netSalary / this._numOfCalculatedMonths : 0;
    }

    get AGIAmount() {
        const totalSum = this._months.reduce((total, month) => total + month.AGIAmount, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgAGIAmount() {
        return this._numOfCalculatedMonths > 0 ? this.AGIAmount / this._numOfCalculatedMonths : 0;
    }

    get finalNetSalary() {
        const totalSum = this._months.reduce((total, month) => total + month.finalNetSalary, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgFinalNetSalary() {
        return this._numOfCalculatedMonths > 0 ? this.finalNetSalary / this._numOfCalculatedMonths : 0;
    }

    get employerSGKDeduction() {
        const totalSum = this._months.reduce((total, month) => total + month.employerSGKDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerSGKDeduction() {
        return this._numOfCalculatedMonths > 0 ? this.employerSGKDeduction / this._numOfCalculatedMonths : 0;
    }

    get employerSGKExemption() {
        const totalSum = this._months.reduce((total, month) => total + month.employerSGKExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerSGKExemption() {
        return this._numOfCalculatedMonths > 0 ? this.employerSGKExemption / this._numOfCalculatedMonths : 0;
    }

    get employerTotalSGKCost() {
        const totalSum = this._months.reduce((total, month) => total + month.employerTotalSGKCost, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerTotalSGKCost() {
        return this._numOfCalculatedMonths > 0 ? this.employerTotalSGKCost / this._numOfCalculatedMonths : 0;
    }

    get employerUnemploymentInsuranceDeduction() {

        const totalSum = this._months.reduce((total, month) => total + month.employerUnemploymentInsuranceDeduction, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerUnemploymentInsuranceDeduction() {
        return this._numOfCalculatedMonths > 0 ? this.employerUnemploymentInsuranceDeduction / this._numOfCalculatedMonths : 0;
    }

    get employerUnemploymentInsuranceExemption() {
        const totalSum = this._months.reduce((total, month) => total + month.employerUnemploymentInsuranceExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerUnemploymentInsuranceExemption() {
        return this._numOfCalculatedMonths > 0 ? this.employerUnemploymentInsuranceExemption / this._numOfCalculatedMonths : 0;
    }

    get employerFinalIncomeTax() {
        const totalSum = this._months.reduce((total, month) => total + month.employerFinalIncomeTax, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get employerIncomeTaxExemptionAmount() {
        const totalSum = this._months.reduce((total, month) => total + month.employerIncomeTaxExemptionAmount, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployerIncomeTaxExemptionAmount() {
        return this._numOfCalculatedMonths > 0 ? this.employerIncomeTaxExemptionAmount / this._numOfCalculatedMonths : 0;
    }

    get employeeMinWageTaxExemptionAmount() {
        const totalSum = this._months.reduce((total, month) => total + month.employeeMinWageTaxExemptionAmount, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgEmployeeMinWageTaxExemptionAmount() {
        return this._numOfCalculatedMonths > 0 ? this.employeeMinWageTaxExemptionAmount / this._numOfCalculatedMonths : 0;
    }

    get avgEmployerFinalIncomeTax() {
        return this._numOfCalculatedMonths > 0 ? this.employerFinalIncomeTax / this._numOfCalculatedMonths : 0;
    }

    get totalSGKExemption() {
        const totalSum = this._months.reduce((total, month) => total + month.totalSGKExemption, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }

    get avgTotalSGKExemption() {
        return this._numOfCalculatedMonths > 0 ? this.totalSGKExemption / this._numOfCalculatedMonths : 0;
    }

    get employerTotalCost() {
        const totalSum = this._months.reduce((total, month) => total + month.employerTotalCost, 0);
        return isNaN(totalSum) ? 0 : totalSum;
    }


    get avgEmployerTotalCost() {
        return this._numOfCalculatedMonths > 0 ? this.employerTotalCost / this._numOfCalculatedMonths : 0;
    }

    getSemesterWorkedDays(half: "first" | "second") {
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

    getSemesterTubitakAvgCost(half: "first" | "second") {
        return this.yearHalfEmployerAvgTotalCost(half, false) *  (this.monthDayCount * 6) / this.getSemesterWorkedDays(half);
    }

    employerHalfTotalCost(half: "first" | "second") {
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
