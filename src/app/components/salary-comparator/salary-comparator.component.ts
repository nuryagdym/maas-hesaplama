import {Component, OnInit} from "@angular/core";
import {YearDataModel} from "../../core/models/year-data.model";
import {YearCalculationModel} from "../../core/models/year-calculation.model";
import {
    DisabilityOptions,
    EmployeeEducationTypes,
    EmployeeTypes,
    ParametersService,
    AGIOptions, EmployeeEducationType,
} from "../../core/services/parameters.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {forkJoin} from "rxjs";
import {finalize} from "rxjs/operators";
import * as XLSX from "xlsx";
import {DatePipe} from "@angular/common";

@Component({
    selector: "app-salary-comparator",
    templateUrl: "./salary-comparator.component.html",
    styleUrls: ["./salary-comparator.component.scss"]
})
export class SalaryComparatorComponent implements OnInit {

    yearParameters: YearDataModel[];
    employeeTypeCalculations: YearCalculationModel[];
    AGIOptions: AGIOptions;
    employeeTypes: EmployeeTypes;
    employeeEducationTypes: EmployeeEducationTypes;
    disabilityOptions: DisabilityOptions;
    calcModes: any;

    selectedYear: YearDataModel;
    salaryInput: number;
    selectedCalcMode: string;
    selectedAGIOption: any;
    selectedDisability: any;
    employeeTypesEducationType: EmployeeEducationType[] = [];
    employerDiscount5746: boolean[] = [];

    AGIIncludedNet: boolean;
    AGIIncludedTax: boolean;

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
    private months: string[];
    private monthSalaryInputs: number[];
    private dayCounts: number[];
    private researchAndDevelopmentDayCounts: number[];
    private workedDays: number;
    private researchAndDevelopmentWorkedDays: number;

    constructor(private parametersService: ParametersService, private _snackBar: MatSnackBar) {

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
            .subscribe(([yearParameters, allParams, salaryComparisonConfig]) => {
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
                err => {
                    alert(err.url + " dosyası yüklenemedi");
                });
    }

    priceInputChanged(index, value) {
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

    calculate(i) {
        const yearCalculationModel: YearCalculationModel = this.employeeTypeCalculations[i];

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
        } catch (e) {
            this._snackBar.open(e, null, {
                duration: 3 * 1000,
            });
        }
    }

    private initEmployeeTypeCalculations() {
        const standardEmployeeType = this.employeeTypes.options.find(emp => emp.id === 1);
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
