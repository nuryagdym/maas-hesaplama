import {ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {YearDataModel} from "../../core/models/year-data.model";
import {YearCalculationModel} from "../../core/models/year-calculation.model";
import {
    DisabilityOptions,
    EmployeeEducationTypes,
    EmployeeType,
    EmployeeTypes,
    ParametersService,
    AGIOptions
} from "../../core/services/parameters.service";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";
import {forkJoin} from "rxjs";
import {finalize} from "rxjs/operators";
import * as XLSX from "xlsx";
import {CommonModule, DatePipe, DecimalPipe, registerLocaleData} from "@angular/common";
import localeTr from "@angular/common/locales/tr";
import {MonthCalculationModel} from "../../core/models/month-calculation.model";
import {NgxCurrencyDirective} from "ngx-currency";
import {FormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatTableModule} from "@angular/material/table";
import {MatSelectModule} from "@angular/material/select";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";

@Component({
    selector: "app-salary-calculator",
    templateUrl: "./salary-calculator.component.html",
    styleUrls: ["./salary-calculator.component.scss"],
    imports: [
        NgxCurrencyDirective,
        CommonModule,
        FormsModule,
        MatInputModule,
        MatTableModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatCardModule,
        MatIconModule,
        MatSnackBarModule,
    ],
    providers: [
        DecimalPipe,
    ]
})
export class SalaryCalculatorComponent implements OnInit {

    yearParameters: YearDataModel[] = [];
    yearCalculationModel: YearCalculationModel | undefined;
    months: string[] = [];
    monthSalaryInputs: number[] = [];
    dayCounts: number[] = [];
    researchAndDevelopmentDayCounts: number[] = [];
    AGIOptions: AGIOptions;
    employeeTypes: EmployeeTypes;
    employeeEducationTypes: EmployeeEducationTypes;
    disabilityOptions: DisabilityOptions;
    calcModes: any;

    selectedYear: YearDataModel | undefined;
    selectedAGIOption: any;
    selectedEmployeeType: EmployeeType | undefined;
    selectedEmployeeEducationType: any;
    selectedDisability: any;
    selectedCalcMode: string = "GROSS_TO_NET";
    applyMinWageTaxExemption: boolean = true;
    enableAGICalculation: boolean = false;
    AGIIncludedNet: boolean = false;
    AGIIncludedTax: boolean = true;
    employerDiscount5746: boolean = false;
    isPensioner: boolean = false;
    showEmployerCosts: boolean = true;

    loading: boolean = false;

    displayedColumns: string[] = ["monthName", "dayInput", "researchAndDevelopmentDayInput", "salaryInput", "calculatedGrossSalary",
        "employeeSGKDeduction", "employeeSGKExemption", "employeeUnemploymentInsuranceDeduction", "employeeUnemploymentInsuranceExemption",
        "appliedTaxSlicesAsString", "employeeIncomeTax", "employerIncomeTaxExemptionAmount",
        "stampTax", "totalStampTaxExemption",
        "AGIAmount",
        "netSalary",
        "finalNetSalary", "employerSGKDeduction", "employerSGKExemption",
        "employerUnemploymentInsuranceDeduction", "employerUnemploymentInsuranceExemption",
        "employerTotalSGKCost", "employerFinalStampTax",
        "employerFinalIncomeTax",
        "employerTotalCost",
        "employerSemesterTotalCost",
        "employerSemesterTubitakTotalCost",
    ];
    columnsToDisplay: string[] = [];

    displayedAvgColumns: string[] = [
        "avgTitle",
        "avgWorkDays",
        "avgResearchAndDevelopmentWorkedDays",
        "userInput",
        "avgCalculatedGrossSalary",
        "avgEmployeeSGKDeduction", "avgEmployeeSGKExemption",
        "avgEmployeeUnemploymentInsuranceDeduction", "avgEmployeeUnemploymentInsuranceExemption",
        "avgAppliedTaxSlicesAsString",
        "avgEmployeeIncomeTax", "avgEmployerIncomeTaxExemptionAmount",
        "avgStampTax", "avgTotalStampTaxExemption", "avgAGIAmount",
        "avgNetSalary",
        "avgFinalNetSalary",
        "avgEmployerSGKDeduction", "avgEmployerSGKExemption",
        "avgEmployerUnemploymentInsuranceDeduction", "avgEmployerUnemploymentInsuranceExemption",
        "avgEmployerTotalSGKCost", "avgEmployerStampTax",
        "avgEmployerFinalIncomeTax", "avgEmployerTotalCost"];
    avgColumnsToDisplay: string[] = [];

    forthGroupColCount: number = 1;
    groupHeaderDisplayedColumns: string[] = [
        "first-group",
        "second-group",
        "third-group",
        "forth-group"];
    groupHeaderColumnsToDisplay: string[] = [];

    employerColumns: string[] = ["employerSGKDeduction", "employerSGKExemption",
        "employerFinalIncomeTax", "employerUnemploymentInsuranceDeduction",
        "employerFinalIncomeTax", "employerTotalSGKCost", "employerFinalStampTax",
        "employerTotalCost", "employerSemesterTotalCost",
        "avgEmployerSGKDeduction", "avgEmployerSGKExemption",
        "avgEmployerUnemploymentInsuranceDeduction", "employerUnemploymentInsuranceExemption",
        "avgEmployerUnemploymentInsuranceExemption",
        "avgEmployerFinalIncomeTax",
        "avgEmployerTotalSGKCost", "avgEmployerStampTax",
        "avgEmployerTotalCost",
        "forth-group",
        "employerSemesterTubitakTotalCost",
    ];


    constructor(
        private parametersService: ParametersService,
        private _snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {
        this.calcModes = YearCalculationModel.calculationModes;
        this.AGIOptions = {
            labelText: "Eş ve Çocuk Durumu",
            options: []
        }
        this.employeeTypes = {
            labelText: "Çalışan Türü",
            options: [],
        }
        this.employeeEducationTypes = {
            labelText: "Eğitim Durumu",
            options: []
        }
        this.disabilityOptions = {
            labelText: "Engellilik Durumu",
            options: []
        }
    }

    ngOnInit() {
        registerLocaleData(localeTr);
        this.loading = true;
        forkJoin([
            this.parametersService.yearParameters,
            this.parametersService.allParameters,
        ])
            .pipe(finalize(() => {
            }))
            .subscribe({
                next: ([yearParameters, allParams]) => {
                    this.months = allParams.MONTHS;
                    this.yearParameters = yearParameters;
                    this.AGIOptions = allParams.AGI_OPTIONS;
                    this.employeeTypes = allParams.EMPLOYEE_TYPES;
                    this.disabilityOptions = allParams.DISABILITY_OPTIONS;
                    this.employeeEducationTypes = allParams.EMPLOYEE_EDUCATION_TYPES;
                    const standardEmployeeType = <EmployeeType>this.employeeTypes.options.find(emp => emp.id === 1);
                    this.yearCalculationModel = new YearCalculationModel(
                        this.months,
                        allParams.CALCULATION_CONSTANTS,
                        standardEmployeeType
                    );

                    this.setDefaults();
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: err => {
                    alert(err.url + " dosyası yüklenemedi");
                }
            });
    }

    private setDefaults() {

        this.selectedYear = this.yearParameters[0];

        this.dayCounts = new Array(this.months.length);
        if (undefined === this.yearCalculationModel) {
            this._snackBar.open("year calculation model is not initialized", undefined, {
                duration: 3 * 1000,
            });
            return;
        }
        this.dayCounts.fill(this.yearCalculationModel.monthDayCount);

        this.researchAndDevelopmentDayCounts = new Array(this.months.length);
        this.researchAndDevelopmentDayCounts.fill(this.yearCalculationModel.monthDayCount);

        this.monthSalaryInputs = new Array(this.months.length);

        this.fillMonthWages();

        this.selectedCalcMode = this.calcModes.options[0].id;
        this.selectedAGIOption = this.AGIOptions.options[0];

        this.selectedEmployeeType = this.employeeTypes.options[0];

        this.selectedEmployeeEducationType = this.employeeEducationTypes.options[0];

        this.selectedDisability = this.disabilityOptions.options[0];

        this.AGIIncludedNet = false;
        this.AGIIncludedTax = true;
        this.employerDiscount5746 = false;
        this.isPensioner = false;

        this.showEmployerCosts = true;
        this.toggleCompanyRelatedColumns(this.showEmployerCosts);
        this.calculate();
    }

    toggleCompanyRelatedColumns(show: boolean) {

        if (!show && this.columnsToDisplay.length === 0) {

            this.columnsToDisplay = this.displayedColumns.filter((col) => this.employerColumns.includes(col));
            this.displayedColumns = this.displayedColumns.filter(col => !this.columnsToDisplay.includes(col));

            this.avgColumnsToDisplay = this.displayedAvgColumns.filter((col) => this.employerColumns.includes(col));
            this.displayedAvgColumns = this.displayedAvgColumns.filter(col => !this.avgColumnsToDisplay.includes(col));

            this.groupHeaderColumnsToDisplay = this.groupHeaderDisplayedColumns.filter((col) => this.employerColumns.includes(col));
            this.groupHeaderDisplayedColumns = this.groupHeaderDisplayedColumns.filter(
                col => !this.groupHeaderColumnsToDisplay.includes(col)
            );

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

    priceInputChanged(index: number, value: number) {
        for (let i = index; i < this.monthSalaryInputs.length; i++) {
            this.monthSalaryInputs[i] = value;
        }
        this.calculate();
    }

    onDayCountChange(index: number) {
        if (undefined === this.yearCalculationModel) {
            this._snackBar.open("year calculation model is not initialized", undefined, {
                duration: 3 * 1000,
            });
            return;
        }
        this.dayCounts[index] = Math.min(this.dayCounts[index], this.yearCalculationModel.monthDayCount);
        // researchAndDevelopmentDayCounts should not be greater than regular work days
        this.researchAndDevelopmentDayCounts[index] = Math.min(this.researchAndDevelopmentDayCounts[index], this.dayCounts[index]);
        this.calculate();
    }

    onResearchAndDevelopmentDayCountChange(index: number) {
        if (undefined === this.yearCalculationModel) {
            this._snackBar.open("year calculation model is not initialized", undefined, {
                duration: 3 * 1000,
            });
            return;
        }
        this.researchAndDevelopmentDayCounts[index] = Math.min(this.researchAndDevelopmentDayCounts[index],
            this.yearCalculationModel.monthDayCount);
        if (this.researchAndDevelopmentDayCounts[index] > this.dayCounts[index]) {
            this.dayCounts[index] = this.researchAndDevelopmentDayCounts[index];
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
        if (undefined === this.yearCalculationModel) {
            this._snackBar.open("year calculation model is not initialized", undefined, {
                duration: 3 * 1000,
            });
            return;
        }
        if (undefined === this.selectedYear) {
            this._snackBar.open("year is not selected", undefined, {
                duration: 3 * 1000,
            });
            return;
        }
        if (undefined === this.selectedEmployeeType) {
            this._snackBar.open("employee type is not selected", undefined, {
                duration: 3 * 1000,
            });
            return;
        }
        this.yearCalculationModel.year = this.selectedYear;
        this.yearCalculationModel.calculationMode = this.selectedCalcMode;
        this.yearCalculationModel.AGI = this.selectedAGIOption;
        this.yearCalculationModel.employeeType = this.selectedEmployeeType;
        this.yearCalculationModel.employeeEduType = this.selectedEmployeeEducationType;
        this.yearCalculationModel.employerDiscount5746 = this.employerDiscount5746;
        this.yearCalculationModel.enteredAmounts = [...this.monthSalaryInputs];
        this.yearCalculationModel.dayCounts = [...this.dayCounts];
        this.yearCalculationModel.researchAndDevelopmentWorkedDays = [...this.researchAndDevelopmentDayCounts];
        this.yearCalculationModel.isAGIIncludedNet = this.AGIIncludedNet;
        this.yearCalculationModel.isAGIIncludedTax = this.AGIIncludedTax;

        this.yearCalculationModel.isPensioner = this.isPensioner;
        this.yearCalculationModel.employeeDisability = this.selectedDisability;
        this.yearCalculationModel.isAGICalculationEnabled = this.enableAGICalculation;
        this.yearCalculationModel.applyMinWageTaxExemption = this.applyMinWageTaxExemption;

        try {
            this.yearCalculationModel.calculate();
        } catch (error) {
            if (error instanceof Error) {
                this._snackBar.open(error.message, undefined, {
                    duration: 3 * 1000,
                });
            }
        }
    }

    private fillMonthWages() {
        if (undefined === this.selectedYear) {
            this._snackBar.open("year is not selected", undefined, {
                duration: 3 * 1000,
            });
            return;
        }
        for (let i = 1; i <= this.monthSalaryInputs.length; i++) {
            this.monthSalaryInputs[i - 1] = MonthCalculationModel.getMinGrossWage(this.selectedYear, i).amount;
        }
    }
}
