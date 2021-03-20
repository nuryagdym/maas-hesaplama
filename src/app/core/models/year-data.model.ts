export class TaxSliceModel {
    rate: number;
    ceil: number;
}

export class DisabledMonthlyIncomeTaxDiscountBaseModel {
    degree: number;
    amount: number;
}

export class YearDataModel {

    year: number;
    minGrossWage: number;
    SGKCeil: number;
    taxSlices: TaxSliceModel[];
    disabledMonthlyIncomeTaxDiscountBases: DisabledMonthlyIncomeTaxDiscountBaseModel[];
}
