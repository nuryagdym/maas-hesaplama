import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { YearDataModel, TaxSliceModel, DisabledMonthlyIncomeTaxDiscountBaseModel } from '../models/year-data.model';
import { environment } from 'src/environments/environment';

interface TaxSliceResponse {
  rate: number;
  ceil: number;
}

interface DisabledMonthlyIncomeTaxDiscountResponse {
  degree: number;
  amount: number;
}

interface yearParameterResponse {
  year: number;
  minGrossWage: number;
  taxSlices: TaxSliceResponse[];
  disabledMonthlyIncomeTaxDiscountBases: DisabledMonthlyIncomeTaxDiscountResponse[];
  SGKCeil: number;
}

interface AllParametersResponse {
  MONTHS: string[],
  CALCULATION_CONSTANTS: CalculationConstants;
  EMPLOYEE_EDUCATION_TYPES: EmployeeEducationTypes;
  DISABILITY_OPTIONS: DisabilityOptions;
  EMPLOYEE_TYPES: EmployeeTypes;
  AGI_OPTIONS: AGIOptions

}
export interface CalculationConstants{
  monthDayCount: number;
  stampTaxRate: number;
  employee: {
      SGKDeductionRate: number;
      SGKEmployerDeductionRate: number;
      SGDPDeductionRate: number;
      unemploymentInsuranceRate: number;
      employerUnemploymentInsuranceRate: number;
      pensionerUnemploymentInsuranceRate: number;
  };
  employer: {
      SGKDeductionRate: number;
      SGKEmployerDeductionRate: number;
      SGDPDeductionRate: number;
      employerDiscount5746: number;
      unemploymentInsuranceRate: number;
      pensionerUnemploymentInsuranceRate: number;
      employerUnemploymentInsuranceRate: number;
      SGK5746AdditionalDiscount: number;
  };
}

export interface EmployeeEducationTypes {
  labelText: string;
  options:
      {
          id: number;
          text: string;
          excemptionRate: number;
      }[]
}

export interface DisabilityOptions {
  labelText: string;
  options:
      {
          id: number;
          degree: number;
          text: string;
      }[]
}

export interface EmployeeTypes {
  labelText: string;
  options:
      {
          id: number;
          text: string;
          AGIApplicable: boolean;
          incomeTaxApplicable: boolean;
          stampTaxApplicable: boolean,
          employerAGIApplicable: boolean;
          employerIncomeTaxApplicable: boolean;
          employerStampTaxApplicable: boolean;
          employerEducationIncomeTaxExcemption: boolean;
          employer5746AdditionalDiscountApplicable: boolean;
      }[]
}

export interface AGIOptions {
  labelText: string;
  options:
      {
          id: number;
          text: string;
          rate: number;
      }[]
}


@Injectable({
  providedIn: 'root'
})
export class ParametersService {

  constructor(private http: HttpClient) {

  }

  get allParameters(): Observable<AllParametersResponse>{
    return this.http.get<AllParametersResponse>(environment.baseURL + 'assets/fixtures.json');
  }

  get yearParameters(): Observable<any>{

    return this.http.get<{yearParameters: yearParameterResponse[]}>(environment.baseURL + 'assets/year-parameters.json').pipe(
      map(response => {

        const params: YearDataModel[] = [];
        response.yearParameters.forEach(item => {
          const newParam = new YearDataModel();
          newParam.year = item.year;
          newParam.minGrossWage = item.minGrossWage;
          newParam.SGKCeil = item.SGKCeil;

          newParam.taxSlices = [];
          item.taxSlices.forEach(it => {
            const taxSlice = new TaxSliceModel();
            taxSlice.rate = it.rate;
            taxSlice.ceil = it.ceil;
            newParam.taxSlices.push(taxSlice);
          });

          newParam.disabledMonthlyIncomeTaxDiscountBases = [];
          item.disabledMonthlyIncomeTaxDiscountBases.forEach(it => {
            const base = new DisabledMonthlyIncomeTaxDiscountBaseModel();
            base.degree = it.degree;
            base.amount = it.amount;
            newParam.disabledMonthlyIncomeTaxDiscountBases.push(base);
          });

          params.push(newParam);
        });
        return params;
      }),
      map(params => {
        //sort in descending order by year
        params.sort((a, b) => b.year - a.year);
        //sort tax slices in ascending order
        params.forEach(item => {
          item.taxSlices.sort((a, b) => a.rate - b.rate);
        });
        return params;
      })
    );
  }
}
