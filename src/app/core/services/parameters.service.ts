import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {
    YearDataModel,
    TaxSliceModel,
    DisabledMonthlyIncomeTaxDiscountBaseModel,
    MinGrossWage
} from "../models/year-data.model";
import {environment} from "../../../environments/environment";

interface TaxSliceResponse {
    rate: number;
    ceil: number;
}

interface DisabledMonthlyIncomeTaxDiscountResponse {
    degree: number;
    amount: number;
}

interface YearParameterResponse {
    year: number;
    minGrossWages: MinGrossWage[];
    minWageEmployeeTaxExemption: boolean;
    taxSlices: TaxSliceResponse[];
    disabledMonthlyIncomeTaxDiscountBases: DisabledMonthlyIncomeTaxDiscountResponse[];
    SGKCeil: number;
}

export interface AllParametersResponse {
    MONTHS: string[];
    CALCULATION_CONSTANTS: CalculationConstants;
    EMPLOYEE_EDUCATION_TYPES: EmployeeEducationTypes;
    DISABILITY_OPTIONS: DisabilityOptions;
    EMPLOYEE_TYPES: EmployeeTypes;
    AGI_OPTIONS: AGIOptions;

}

export interface CalculationConstants {
    monthDayCount: number;
    stampTaxRate: number;
    employee: {
        SGKDeductionRate: number;
        SGDPDeductionRate: number;
        unemploymentInsuranceRate: number;
        pensionerUnemploymentInsuranceRate: number;
    };
    employer: {
        SGKDeductionRate: number;
        SGDPDeductionRate: number;
        employerDiscount5746: number;
        unemploymentInsuranceRate: number;
        pensionerUnemploymentInsuranceRate: number;
        SGK5746AdditionalDiscount: number;
    };
}

export interface EmployeeEducationTypes {
    labelText: string;
    options: EmployeeEducationType[];
}

export interface EmployeeEducationType {
    id: number;
    text: string;
    exemptionRate: number;
}

export interface DisabilityOptions {
    labelText: string;
    options: DisabilityOption[];
}

export interface DisabilityOption {
    id: number;
    degree: number;
    text: string;
}

export interface EmployeeTypes {
    labelText: string;
    options: EmployeeType[];
}

export interface EmployeeType {
    id: number;
    text: string;
    desc: string;
    // show order
    order: number;
    // show to users or not
    show: boolean;
    SGKApplicable: boolean;
    SGKMinWageBasedExemption: boolean;
    SGKMinWageBased17103Exemption: boolean;
    unemploymentInsuranceApplicable: boolean;
    AGIApplicable: boolean;
    incomeTaxApplicable: boolean;
    taxMinWageBasedExemption: boolean;
    researchAndDevelopmentTaxExemption: boolean;
    stampTaxApplicable: boolean;
    employerSGKApplicable: boolean;
    employerUnemploymentInsuranceApplicable: boolean;
    employerIncomeTaxApplicable: boolean;
    employerStampTaxApplicable: boolean;
    employerEducationIncomeTaxExemption: boolean;
    employerSGKShareTotalExemption: boolean;
    employerSGKDiscount5746Applicable: boolean;
    employer5746AdditionalDiscountApplicable: boolean;
}

export interface AGIOptions {
    labelText: string;
    options: AGIOption[];
}

export interface AGIOption {
    id: number;
    text: string;
    rate: number;
}


@Injectable({
    providedIn: "root"
})
export class ParametersService {

    constructor(private http: HttpClient) {

    }

    get salaryComparisonConfig(): Observable<{employeeTypeConfigurations: [{employeeTypeId: number}]}> {
        return this.http.get<any>(environment.baseURL + "assets/salary-comparison.json").pipe(map((params) => {
            return params;
        }));
    }

    get allParameters(): Observable<AllParametersResponse> {
        return this.http.get<AllParametersResponse>(environment.baseURL + "assets/fixtures.json").pipe(map((params) => {
            params.EMPLOYEE_TYPES.options = params.EMPLOYEE_TYPES.options.filter((a) => {
                return a.show;
            });
            params.EMPLOYEE_TYPES.options.sort((a, b) => {
                return a.order - b.order;
            });
            return params;
        }));
    }

    get yearParameters(): Observable<any> {

        return this.http.get<{ yearParameters: YearParameterResponse[] }>(environment.baseURL + "assets/year-parameters.json").pipe(
            map(response => {

                const params: YearDataModel[] = [];
                response.yearParameters.forEach(item => {
                    const taxSlices: TaxSliceModel[] = [];
                    item.taxSlices.forEach(it => {
                        taxSlices.push(new TaxSliceModel(it.rate, it.ceil));
                    });

                    const disabledMonthlyIncomeTaxDiscountBases: DisabledMonthlyIncomeTaxDiscountBaseModel[] = [];
                    item.disabledMonthlyIncomeTaxDiscountBases.forEach(it => {
                        disabledMonthlyIncomeTaxDiscountBases.push(new DisabledMonthlyIncomeTaxDiscountBaseModel(it.degree, it.amount));
                    });

                  const newParam = new YearDataModel(
                    item.year,
                    item.minGrossWages,
                    item.minWageEmployeeTaxExemption,
                    taxSlices,
                    disabledMonthlyIncomeTaxDiscountBases,
                  );

                    params.push(newParam);
                });
                return params;
            }),
            map(params => {
                // sort in descending order by year
                params.sort((a, b) => b.year - a.year);
                // sort tax slices in ascending order
                params.forEach(item => {
                    item.taxSlices.sort((a, b) => a.rate - b.rate);
                });
                return params;
            })
        );
    }
}
