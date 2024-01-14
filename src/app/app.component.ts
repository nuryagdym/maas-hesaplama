import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatTabsModule} from "@angular/material/tabs";
import {SalaryCalculatorComponent} from "./components/salary-calculator/salary-calculator.component";
import {SalaryComparatorComponent} from "./components/salary-comparator/salary-comparator.component";

@Component({
    selector: 'salary-app-root',
    standalone: true,
    imports: [
        SalaryCalculatorComponent,
        SalaryComparatorComponent,
        RouterOutlet,
        MatTabsModule,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
}
