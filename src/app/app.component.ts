import {Component, OnInit} from "@angular/core";
import {
    ParametersService,
    AGIOptions,
    EmployeeTypes,
    EmployeeEducationTypes,
    DisabilityOptions
} from "./core/services/parameters.service";
import {YearDataModel} from "./core/models/year-data.model";
import {finalize} from "rxjs/operators";
import {forkJoin} from "rxjs";
import {YearCalculationModel} from "./core/models/year-calculation.model";
import {MatSnackBar} from "@angular/material/snack-bar";
import * as XLSX from "xlsx";
import {DatePipe} from "@angular/common";

@Component({
    selector: "salary-app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {

    yearParameters: YearDataModel[];
    yearCalculationModel: YearCalculationModel;
    months: string[];
    monthSalaryInputs: number[];
    dayCounts: number[];
    AGIOptions: AGIOptions;
    employeeTypes: EmployeeTypes;
    employeeEducationTypes: EmployeeEducationTypes;
    disabilityOptions: DisabilityOptions;
    calcModes: any;

    selectedYear: YearDataModel;
    selectedAGIOption: any;
    selectedEmployeeType: any;
    selectedEmployeeEducationType: any;
    selectedDisability: any;
    selectedCalcMode: string;

    AGIIncludedNet: boolean;
    AGIIncludedTax: boolean;
    employerDiscount5746: boolean;
    isPensioner: boolean;
    isEmployer: boolean;
    showEmployerCosts: boolean;

    loading = false;

    displayedColumns: string[] = ["monthName", "dayInput", "salaryInput", "calculatedGrossSalary",
        "employeeSGKDeduction", "employeeUnemploymentInsuranceDeduction",
        "appliedTaxSlicesAsString", "employeeIncomeTax", "stampTax", "netSalary",
        "AGIamount", "finalNetSalary", "employerSGKDeduction", "employerUnemploymentInsuranceDeduction",
        "employerFinalIncomeTax", "employerTotalCost", "employerSemesterTotalCost"];
    columnsToDisplay: string[] = [];

    displayedAvgColumns: string[] = ["avgTitle", "avgCalculatedGrossSalary", "avgEmployeeSGKDeduction",
        "avgEmployeeUnemploymentInsuranceDeduction", "avgEmployeeIncomeTax",
        "avgStampTax", "avgNetSalary", "avgAGIamount", "avgFinalNetSalary", "avgEmployerSGKDeduction",
        "avgEmployerUnemploymentInsuranceDeduction",
        "avgEmployerFinalIncomeTax", "avgEmployerTotalCost"];
    avgColumnsToDisplay: string[] = [];

    forthGroupColCount = 1;
    groupHeaderDisplayedColumns = ["first-group", "second-group", "third-group", "forth-group"];
    groupHeaderColumnsToDisplay = [];

    employerColumns: string[] = ["employerSGKDeduction", "employerFinalIncomeTax", "employerUnemploymentInsuranceDeduction",
        "employerFinalIncomeTax", "employerTotalCost", "employerSemesterTotalCost",
        "avgEmployerSGKDeduction", "avgEmployerUnemploymentInsuranceDeduction", "avgEmployerFinalIncomeTax",
        "avgEmployerTotalCost", "forth-group"];

    constructor(private parametersService: ParametersService, private _snackBar: MatSnackBar) {
        //employerTotalSGKCost, employerStampTax
    }

    ngOnInit() {

        this.loading = true;
        forkJoin([
            this.parametersService.yearParameters,
            this.parametersService.allParameters]
        )
            .pipe(finalize(() => {

            }))
            .subscribe(([yearParameters, allParams]) => {
                    this.months = allParams.MONTHS;
                    this.yearParameters = yearParameters;
                    this.AGIOptions = allParams.AGI_OPTIONS;
                    this.employeeTypes = allParams.EMPLOYEE_TYPES;
                    this.disabilityOptions = allParams.DISABILITY_OPTIONS;
                    this.employeeEducationTypes = allParams.EMPLOYEE_EDUCATION_TYPES;
                    this.yearCalculationModel = new YearCalculationModel(this.months, allParams.CALCULATION_CONSTANTS);
                    this.calcModes = this.yearCalculationModel.calculationModes;

                    this.setDefaults();
                    this.loading = false;
                },
                err => {
                    alert(err.url + " dosyası yüklenemedi");
                });
    }

    private setDefaults() {

        this.selectedYear = this.yearParameters[0];

        this.dayCounts = new Array(this.months.length);
        this.dayCounts.fill(this.yearCalculationModel.monthDayCount);

        this.monthSalaryInputs = new Array(this.months.length);
        this.monthSalaryInputs.fill(0);

        this.selectedCalcMode = this.calcModes.options[0].id;
        this.selectedAGIOption = this.AGIOptions.options[0];

        this.selectedEmployeeType = this.employeeTypes.options[0];

        this.selectedEmployeeEducationType = this.employeeEducationTypes.options[0];

        this.selectedDisability = this.disabilityOptions.options[0];

        this.AGIIncludedNet = false;
        this.AGIIncludedTax = true;
        this.employerDiscount5746 = false;
        this.isPensioner = false;
        this.isEmployer = false;

        this.showEmployerCosts = false;
        this.toggleCompanyRelatedColumns(this.showEmployerCosts);
    }

    toggleCompanyRelatedColumns(show: boolean) {

        if (!show && this.columnsToDisplay.length === 0) {

            this.columnsToDisplay = this.displayedColumns.filter((col) => this.employerColumns.includes(col));
            this.displayedColumns = this.displayedColumns.filter(col => !this.columnsToDisplay.includes(col));

            this.avgColumnsToDisplay = this.displayedAvgColumns.filter((col) => this.employerColumns.includes(col));
            this.displayedAvgColumns = this.displayedAvgColumns.filter(col => !this.avgColumnsToDisplay.includes(col));

            this.groupHeaderColumnsToDisplay = this.groupHeaderDisplayedColumns.filter((col) => this.employerColumns.includes(col));
            this.groupHeaderDisplayedColumns = this.groupHeaderDisplayedColumns.filter(col => !this.groupHeaderColumnsToDisplay.includes(col));

        } else {
            this.columnsToDisplay.forEach(col => {
                this.displayedColumns.push(col);
            });
            this.avgColumnsToDisplay.forEach(col => {
                this.displayedAvgColumns.push(col);
            });
            this.groupHeaderColumnsToDisplay.forEach(col => {
                this.groupHeaderDisplayedColumns.push(col);
            });
            this.forthGroupColCount = this.columnsToDisplay.length === 0 ?
                this.displayedColumns.filter((col) => this.employerColumns.includes(col)).length
                : this.columnsToDisplay.length;
            this.columnsToDisplay = [];
            this.avgColumnsToDisplay = [];
            this.groupHeaderColumnsToDisplay = [];
        }
    }

    priceInputChanged(index, value) {
        for (let i = index; i < this.monthSalaryInputs.length; i++) {
            this.monthSalaryInputs[i] = value;
        }
        this.calculate();
    }

    exportExcel() {
        /* table id is passed over here */
        const element = document.getElementById("salary-table");
        const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element, {raw: true, display: true});

        /* generate workbook and add the worksheet */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sayfa1");

        /* save to file */
        XLSX.writeFile(wb, "maas-hesaplama-tablosu-" + (new DatePipe("en-US")).transform(Date.now(), "yyyy-MM-dd") + ".xlsx");
    }

    calculate() {
        this.yearCalculationModel.year = this.selectedYear;
        this.yearCalculationModel.calculationMode = this.selectedCalcMode;
        this.yearCalculationModel.AGI = this.selectedAGIOption;
        this.yearCalculationModel.employeeType = this.selectedEmployeeType;
        this.yearCalculationModel.employeeEduType = this.selectedEmployeeEducationType;
        this.yearCalculationModel.employerDiscount5746 = this.employerDiscount5746;
        this.yearCalculationModel.enteredAmounts = [...this.monthSalaryInputs];
        this.yearCalculationModel.dayCounts = [...this.dayCounts];
        this.yearCalculationModel.isAGIIncludedNet = this.AGIIncludedNet;
        this.yearCalculationModel.isAGIIncludedTax = this.AGIIncludedTax;

        this.yearCalculationModel.isPensioner = this.isPensioner;
        this.yearCalculationModel.isEmployer = this.isEmployer;
        this.yearCalculationModel.employeeDisability = this.selectedDisability;
        try {
            this.yearCalculationModel.calculate();
        } catch (e) {
            this._snackBar.open(e, null, {
                duration: 3 * 1000,
            });
        }
    }
}
