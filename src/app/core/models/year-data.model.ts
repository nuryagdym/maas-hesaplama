export class TaxSliceModel {
    constructor(
        public rate: number,
        public ceil: number
    ) {
    }
}

export class DisabledMonthlyIncomeTaxDiscountBaseModel {
    constructor(
        public degree: number,
        public amount: number
    ) {
    }
}

export class MinGrossWage {
    constructor(
        public startMonth: number,
        public amount: number,
        public SGKCeil: number,
    ) {
    }
}

export class YearDataModel {
    constructor(
        public year: number,
        public minGrossWages: MinGrossWage[],
        public minWageEmployeeTaxExemption: boolean,
        public taxSlices: TaxSliceModel[],
        public disabledMonthlyIncomeTaxDiscountBases: DisabledMonthlyIncomeTaxDiscountBaseModel[],
    ) {
    }
}
