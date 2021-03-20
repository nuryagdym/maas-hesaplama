import { MonthCalculationModel } from './month-calculation.model';
import { YearDataModel } from './year-data.model';
import {EmployeeType} from "../services/parameters.service";

export class YearCalculationModel {

    private _year: YearDataModel;
    private _months: MonthCalculationModel[];
    private _enteredAmounts: number[];
    private _workedDays: number[];
    private _researchAndDevelopmentWorkedDays: number[];

    private _calcMode: string;
    private _isPensioner: boolean;
    private _isAGIIncludedNet: boolean;
    private _isAGIIncludedTax: boolean;
    private _applyEmployerDiscount5746: boolean;
    private _AGI: any;
    private _employeeType: EmployeeType;
    private _employeeEduType: any;
    private _employeeDisability: any;
    private _numOfCalculatedMonths: number;

    private _parameters:any;

    constructor(months: string[], salaryConsants: any){

        this._parameters = salaryConsants;

        this._months = [];
        let previousMonth: MonthCalculationModel;
        for(let i = 0; i < months.length; i++){
          const month = new MonthCalculationModel(this._parameters);
          month.monthName = months[i];
          month.previousMonth = previousMonth;
          previousMonth = month;
          this._months.push(month);
        }
    }

    set year(y: YearDataModel){
        this._year = y;
    }

    get calculationModes(){
        return {
            labelText: "Hesaplama Şekli",
            options: [
                {
                    id: 'GROSS_TO_NET',
                    text: 'Brütten Nete'
                },
                {
                    id: 'NET_TO_GROSS',
                    text: 'Netten Brüte'
                },
                {
                    id: 'TOTAL_TO_GROSS',
                    text: 'Toplam Maliyete Göre'
                }
            ]
        };
    }

    set calculationMode(modeId: string){
        this._calcMode = modeId;
    }
    set isPensioner(is: boolean){
        this._isPensioner = is;
    }
    set isAGIIncludedNet(is: boolean){
        this._isAGIIncludedNet = is;
    }
    set AGI(agi: any){
        this._AGI = agi;
    }
    set employeeType(type: any){
        this._employeeType = type;
    }
    set employeeEduType(type: any){
        this._employeeEduType = type;
    }
    set employerDiscount5746(apply: boolean){
        this._applyEmployerDiscount5746 = apply;
    }
    set employeeDisability(d: any){
        this._employeeDisability = d;
    }
    set enteredAmounts(amounts: number[]){
        this._enteredAmounts = amounts;
    }
    set dayCounts(days: number[]){
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
    calculate(){
        this._numOfCalculatedMonths = 0;
        let result = 0;
        this._months.forEach((m, i) => {
            result = m.calculate(this._calcMode, this._year, this._enteredAmounts[i], this._workedDays[i], this._researchAndDevelopmentWorkedDays[i],
                this._AGI.rate, this._employeeType, this._employeeEduType.exemptionRate,
                this._applyEmployerDiscount5746, this._isAGIIncludedNet, this._isAGIIncludedTax, this._isPensioner, this._employeeDisability.degree);
            if(m.calculatedGrossSalary > 0) this._numOfCalculatedMonths++;
        });
    }

    get monthDayCount(){
        return this._parameters.monthDayCount;
    }
    get months(): MonthCalculationModel[]{
        return this._months;
    }

    get calculatedGrossSalary(){
        let total = this._months.reduce((total, month) => total + month.calculatedGrossSalary, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgCalculatedGrossSalary(){
        return this._numOfCalculatedMonths > 0 ? this.calculatedGrossSalary / this._numOfCalculatedMonths : 0;
    }

    get employeeSGKDeduction(){
        let total = this._months.reduce((total, month) => total + month.employeeSGKDeduction, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgEmployeeSGKDeduction(){
        return this._numOfCalculatedMonths > 0 ? this.employeeSGKDeduction / this._numOfCalculatedMonths : 0;
    }

    get employeeUnemploymentInsuranceDeduction(){
        let total = this._months.reduce((total, month) => total + month.employeeUnemploymentInsuranceDeduction, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgEmployeeUnemploymentInsuranceDeduction(){
        return this._numOfCalculatedMonths > 0 ? this.employeeUnemploymentInsuranceDeduction / this._numOfCalculatedMonths : 0;
    }

    get employeeIncomeTax(){
        let total = this._months.reduce((total, month) => total + month.employeeIncomeTax, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgEmployeeIncomeTax(){
        return this._numOfCalculatedMonths > 0 ? this.employeeIncomeTax / this._numOfCalculatedMonths : 0;
    }

    get stampTax(){
        let total = this._months.reduce((total, month) => total + month.stampTax, 0);
        return isNaN(total) ? 0 : total;
    }

    get avgStampTax(){
        return this._numOfCalculatedMonths > 0 ? this.stampTax / this._numOfCalculatedMonths : 0;
    }

    get employerStampTax(){
        let total = this._months.reduce((total, month) => total + month.employerStampTax, 0);
        return isNaN(total) ? 0 : total;
    }

    get avgEmployerStampTax() {
        return this._numOfCalculatedMonths > 0 ? this.employerStampTax / this._numOfCalculatedMonths : 0;
    }

    get employerStampTaxExemption() {
        const total = this._months.reduce((total, month) => total + month.employerStampTaxExemption, 0);
        return isNaN(total) ? 0 : total;
    }

    get avgEmployerStampTaxExemption() {
        return this._numOfCalculatedMonths > 0 ? this.employerStampTaxExemption / this._numOfCalculatedMonths : 0;
    }

    get netSalary(){
        let total = this._months.reduce((total, month) => total + month.netSalary, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgNetSalary(){
        return this._numOfCalculatedMonths > 0 ? this.netSalary / this._numOfCalculatedMonths : 0;
    }

    get AGIamount(){
        let total = this._months.reduce((total, month) => total + month.AGIamount, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgAGIamount(){
        return this._numOfCalculatedMonths > 0 ? this.AGIamount / this._numOfCalculatedMonths : 0;
    }

    get employerAGIAmount(){
        let total = this._months.reduce((total, month) => total + month.employerAGIAmount, 0);
        return isNaN(total) ? 0 : total;
    }

    get avgEmployerAGIAmount(){
        return this._numOfCalculatedMonths > 0 ? this.employerAGIAmount / this._numOfCalculatedMonths : 0;
    }

    get finalNetSalary(){
        let total = this._months.reduce((total, month) => total + month.finalNetSalary, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgFinalNetSalary(){
        return this._numOfCalculatedMonths > 0 ? this.finalNetSalary / this._numOfCalculatedMonths : 0;
    }

    get employerSGKDeduction(){
        let total = this._months.reduce((total, month) => total + month.employerSGKDeduction, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgEmployerSGKDeduction(){
        return this._numOfCalculatedMonths > 0 ? this.employerSGKDeduction / this._numOfCalculatedMonths : 0;
    }

    get employerTotalSGKCost(){
        let total = this._months.reduce((total, month) => total + month.employerTotalSGKCost, 0);
        return isNaN(total) ? 0 : total;
    }

    get avgEmployerTotalSGKCost(){
        return this._numOfCalculatedMonths > 0 ? this.employerTotalSGKCost / this._numOfCalculatedMonths : 0;
    }

    get employerUnemploymentInsuranceDeduction(){

        let total = this._months.reduce((total, month) => {
            return total + month.employerUnemploymentInsuranceDeduction
        },
        0);
        return isNaN(total) ? 0 : total;
    }
    get avgEmployerUnemploymentInsuranceDeduction(){
        return this._numOfCalculatedMonths > 0 ? this.employerUnemploymentInsuranceDeduction / this._numOfCalculatedMonths : 0;
    }

    get employerFinalIncomeTax(){
        let total = this._months.reduce((total, month) => total + month.employerFinalIncomeTax, 0);
        return isNaN(total) ? 0 : total;
    }
    get employerIncomeTaxExemptionAmount() {
        const total = this._months.reduce((total, month) => total + month.employerIncomeTaxExemptionAmount, 0);
        return isNaN(total) ? 0 : total;
    }
    get avgEmployerIncomeTaxExemptionAmount() {
        return this._numOfCalculatedMonths > 0 ? this.employerIncomeTaxExemptionAmount / this._numOfCalculatedMonths : 0;
    }
    get avgEmployerFinalIncomeTax(){
        return this._numOfCalculatedMonths > 0 ? this.employerFinalIncomeTax / this._numOfCalculatedMonths : 0;
    }

    get employerTotalCost(){
        let total = this._months.reduce((total, month) => total + month.employerTotalCost, 0);
        return isNaN(total) ? 0 : total;
    }


    get avgEmployerTotalCost(){
        return this._numOfCalculatedMonths > 0 ? this.employerTotalCost / this._numOfCalculatedMonths : 0;
    }

    employerHalfTotalCost(half: 'first' | 'second'){
        let l = 0;
        let r = this._months.length-6;
        if(half == 'second'){
            l = 6;
            r = this._months.length-1;
        }
        let total = 0;
        for(let i = l; i < r; i++){
            total += this._months[i].employerTotalCost;
        }
        return isNaN(total) ? 0 : total;
    }

    yearHalfEmployerAvgTotalCost(half: 'first' | 'second'){
        let l = 0;
        let r = this._months.length-6;
        if(half == 'second'){
            l = 6;
            r = this._months.length-1;
        }
        let workedDays = 0;
        for(let i = l; i < r; i++){
            if(this._months[i].calculatedGrossSalary > 0) workedDays++;
        }
        if(workedDays == 0) return 0;
        return this.employerHalfTotalCost(half) / workedDays;
    }

}
