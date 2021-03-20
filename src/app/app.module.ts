import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { HttpClientModule } from "@angular/common/http";
import { CommonModule, DecimalPipe, registerLocaleData } from "@angular/common";
import { FormsModule } from "@angular/forms";
import localeTR from "@angular/common/locales/tr";
import { NgxCurrencyModule } from "ngx-currency";
import {MatInputModule} from "@angular/material/input";
import {MatTableModule} from "@angular/material/table";
import {MatSelectModule} from "@angular/material/select";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatCardModule} from "@angular/material/card";
import { FlexLayoutModule } from "@angular/flex-layout";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import { ENVIRONMENT_SPECIFIC_PROVIDERS } from "src/environments/environment";
import {MatIconModule} from "@angular/material/icon";

registerLocaleData(localeTR, "tr");

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    NgxCurrencyModule,
    FlexLayoutModule,
    MatInputModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule
  ],
  providers: [
    ENVIRONMENT_SPECIFIC_PROVIDERS,
    DecimalPipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
