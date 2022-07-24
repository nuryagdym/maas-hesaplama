export class TaxSliceModel {
    rate: number;
    ceil: number;
}

export class DisabledMonthlyIncomeTaxDiscountBaseModel {
    degree: number;
    amount: number;
}

export class MinGrossWage {
    startMonth: number;
    amount: number;
    SGKCeil: number;
}

export class YearDataModel {

    year: number;
    minGrossWages: MinGrossWage[];
    minWageEmployeeTaxExemption: boolean;
    taxSlices: TaxSliceModel[];
    disabledMonthlyIncomeTaxDiscountBases: DisabledMonthlyIncomeTaxDiscountBaseModel[];
}
