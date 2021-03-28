import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SalaryComparatorComponent } from "./salary-comparator.component";

describe("SalaryComparatorComponent", () => {
  let component: SalaryComparatorComponent;
  let fixture: ComponentFixture<SalaryComparatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalaryComparatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalaryComparatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
