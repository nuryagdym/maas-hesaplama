import {Component, OnInit} from "@angular/core";
import {YearDataModel} from "../../core/models/year-data.model";
import {YearCalculationModel} from "../../core/models/year-calculation.model";
import {
    DisabilityOptions,
    EmployeeEducationTypes,
    EmployeeTypes,
    ParametersService,
    AGIOptions,
    EmployeeEducationType,
    EmployeeType,
} from "../../core/services/parameters.service";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";
import {forkJoin} from "rxjs";
import {finalize} from "rxjs/operators";
import * as XLSX from "xlsx";
import {CommonModule, DatePipe} from "@angular/common";
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
    selector: "app-salary-comparator",
    standalone: true,
    templateUrl: "./salary-comparator.component.html",
    styleUrls: ["./salary-comparator.component.scss"],
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
})
export class SalaryComparatorComponent implements OnInit {

    yearParameters: YearDataModel[] = [];
    employeeTypeCalculations: YearCalculationModel[] = [];
    AGIOptions: AGIOptions;
    employeeTypes: EmployeeTypes;
    employeeEducationTypes: EmployeeEducationTypes;
    disabilityOptions: DisabilityOptions;
    calcModes: any;

    selectedYear: YearDataModel | undefined;
    salaryInput: number = 0;
    selectedCalcMode: string = "GROSS_TO_NET";
    selectedAGIOption: any;
    selectedDisability: any;
    employeeTypesEducationType: EmployeeEducationType[] = [];
    employerDiscount5746: boolean[] = [];

    AGIIncludedNet: boolean = false;
    AGIIncludedTax: boolean = true;

    loading = false;

    displayedColumns: string[] = [
        "employeeType",
        "calculatedGrossSalary",
        "finalNetSalary",
        "employerSGKDeduction",
        "employerUnemploymentInsuranceDeduction",
        "totalSGKExemption",
        "employerIncomeTaxExemptionAmount",
        "totalStampTaxExemption",
        "employerTotalSGKCost",
        "employerFinalStampTax",
        "employerFinalIncomeTax",
        "employerFirstSemesterTotalCost",
        "employerSecondSemesterTotalCost",
        "employerTotalCost",
    ];

    private parameters: any;
    private months: string[] = [];
    private monthSalaryInputs: number[] = [];
    private dayCounts: number[] = [];
    private researchAndDevelopmentDayCounts: number[] = [];
    private workedDays: number = 0;
    private researchAndDevelopmentWorkedDays: number = 0;

    constructor(private parametersService: ParametersService, private _snackBar: MatSnackBar) {
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
        this.employeeTypeCalculations = [];
        this.loading = true;
        forkJoin([
            this.parametersService.yearParameters,
            this.parametersService.allParameters,
            this.parametersService.salaryComparisonConfig,
            ]
        )
            .pipe(finalize(() => {

            }))
            .subscribe({next: ([yearParameters, allParams, salaryComparisonConfig]) => {
                    this.months = allParams.MONTHS;
                    this.parameters = allParams;
                    this.yearParameters = yearParameters;
                    this.AGIOptions = allParams.AGI_OPTIONS;
                    this.employeeTypes = allParams.EMPLOYEE_TYPES;
                    this.disabilityOptions = allParams.DISABILITY_OPTIONS;
                    this.employeeEducationTypes = allParams.EMPLOYEE_EDUCATION_TYPES;
                    this.calcModes = YearCalculationModel.calculationModes;
                    this.employeeTypes.options = this.employeeTypes.options.filter((type) => {
                        return !!salaryComparisonConfig.employeeTypeConfigurations.find((conf) => {
                            return conf.employeeTypeId === type.id;
                        });
                    });
                    this.setDefaults();
                    this.initEmployeeTypeCalculations();
                    this.calculateAll();
                    this.loading = false;
                },
                error: err => {
                    alert(err.url + " dosyası yüklenemedi");
                }});
    }

    priceInputChanged(index: number, value: number) {
        for (let i = index; i < this.monthSalaryInputs.length; i++) {
            this.monthSalaryInputs[i] = value;
        }
        this.calculateAll();
    }

    exportExcel() {
        /* table id is passed over here */
        const element = document.getElementById("salary-compare-table");
        const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element, {raw: true, display: true});

        /* generate workbook and add the worksheet */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sayfa1");

        /* save to file */
        XLSX.writeFile(wb, "maas-karsilastirma-tablosu-" + (new DatePipe("en-US")).transform(Date.now(), "yyyy-MM-dd") + ".xlsx");
    }

    calculateAll() {

        for (let i = 0; i < this.employeeTypeCalculations.length; i++) {
            this.calculate(i);
        }
    }

    calculate(i: number) {
        const yearCalculationModel: YearCalculationModel = this.employeeTypeCalculations[i];
        if (undefined === this.selectedYear) {
            this._snackBar.open("year is not selected", undefined, {
                duration: 3 * 1000,
            });
            return;
        }
        yearCalculationModel.year = this.selectedYear;
        yearCalculationModel.calculationMode = this.selectedCalcMode;
        yearCalculationModel.AGI = this.selectedAGIOption;
        yearCalculationModel.employeeEduType = this.employeeTypesEducationType[i];
        yearCalculationModel.employerDiscount5746 = this.employerDiscount5746[i];
        yearCalculationModel.enteredAmounts = [...this.monthSalaryInputs];
        yearCalculationModel.dayCounts = [...this.dayCounts];
        yearCalculationModel.researchAndDevelopmentWorkedDays = [...this.researchAndDevelopmentDayCounts];
        yearCalculationModel.isAGIIncludedNet = this.AGIIncludedNet;
        yearCalculationModel.isAGIIncludedTax = this.AGIIncludedTax;

        yearCalculationModel.isPensioner = false;
        yearCalculationModel.employeeDisability = this.selectedDisability;
        yearCalculationModel.applyMinWageTaxExemption = true;
        try {
            yearCalculationModel.calculate();
        } catch (error) {
            if (error instanceof Error) {
                this._snackBar.open(error.message, undefined, {
                    duration: 3 * 1000,
                });
            }
        }
    }

    private initEmployeeTypeCalculations() {
        const standardEmployeeType = <EmployeeType>this.employeeTypes.options.find(emp => emp.id === 1);
        this.employeeTypes.options.forEach((type) => {
            const yearCalculationModel = new YearCalculationModel(this.months, this.parameters.CALCULATION_CONSTANTS, standardEmployeeType);
            yearCalculationModel.employeeType = type;
            this.employeeTypeCalculations.push(yearCalculationModel);

            this.employerDiscount5746.push(false);

            this.employeeTypesEducationType.push(this.employeeEducationTypes.options[0]);
        });
    }

    private setDefaults() {

        this.selectedYear = this.yearParameters[0];

        this.workedDays = this.parameters.CALCULATION_CONSTANTS.monthDayCount;
        this.dayCounts = new Array(this.months.length);
        this.dayCounts.fill(this.workedDays);

        this.researchAndDevelopmentWorkedDays = this.parameters.CALCULATION_CONSTANTS.monthDayCount;
        this.researchAndDevelopmentDayCounts = new Array(this.months.length);
        this.researchAndDevelopmentDayCounts.fill(this.researchAndDevelopmentWorkedDays);

        this.salaryInput = this.selectedYear.minGrossWages[0].amount;
        this.monthSalaryInputs = new Array(this.months.length);
        this.monthSalaryInputs.fill(this.salaryInput);

        this.selectedCalcMode = this.calcModes.options[0].id;
        this.selectedAGIOption = this.AGIOptions.options[0];

        this.selectedDisability = this.disabilityOptions.options[0];

        this.AGIIncludedNet = false;
        this.AGIIncludedTax = true;
    }
}
