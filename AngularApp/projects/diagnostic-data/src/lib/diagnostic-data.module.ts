import 'd3';
import 'nvd3';
import { DetectorControlService } from './services/detector-control.service';
import { DiagnosticService } from './services/diagnostic.service';
import { TelemetryService } from './services/telemetry/telemetry.service';
import { NvD3Module } from 'ng2-nvd3';
import { MarkdownModule } from 'ngx-markdown';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CardSelectionComponent } from './components/card-selection/card-selection.component';
import { CommAlertComponent } from './components/comm-alert/comm-alert.component';
import {
    CopyInsightDetailsComponent
} from './components/copy-insight-details/copy-insight-details.component';
import { DataContainerComponent } from './components/data-container/data-container.component';
import { DataRenderBaseComponent } from './components/data-render-base/data-render-base.component';
import { DataSummaryComponent } from './components/data-summary/data-summary.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import {
    DetectorContainerComponent
} from './components/detector-container/detector-container.component';
import {
    DetectorControlComponent, InternalPipe
} from './components/detector-control/detector-control.component';
import {
    DetectorListComponent, DetectorOrderPipe
} from './components/detector-list/detector-list.component';
import { DetectorViewComponent } from './components/detector-view/detector-view.component';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import { DynamicDataComponent } from './components/dynamic-data/dynamic-data.component';
import { DynamicInsightComponent } from './components/dynamic-insight/dynamic-insight.component';
import { EmailComponent } from './components/email/email.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { InsightsComponent } from './components/insights/insights.component';
import { LoaderViewComponent } from './components/loader-view/loader-view.component';
import { MarkdownEditorComponent } from './components/markdown-editor/markdown-editor.component';
import { MarkdownComponent } from './components/markdown/markdown.component';
import { Nvd3GraphComponent } from './components/nvd3-graph/nvd3-graph.component';
import {
    StarRatingFeedbackComponent
} from './components/star-rating-feedback/star-rating-feedback.component';
import { StarRatingComponent } from './components/star-rating/star-rating.component';
import { StatusIconComponent } from './components/status-icon/status-icon.component';
import {
    TimeSeriesGraphComponent
} from './components/time-series-graph/time-series-graph.component';
import {
    TimeSeriesInstanceGraphComponent
} from './components/time-series-instance-graph/time-series-instance-graph.component';
import {
    DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig, INTERNAL_PROD_CONFIGURATION
} from './config/diagnostic-data-config';
import { ClipboardService } from './services/clipboard.service';
import { CommsService } from './services/comms.service';
import { GuageGraphicComponent } from './components/guage-graphic/guage-graphic.component';
import { GuageControlComponent } from './components/guage-control/guage-control.component';
import { FeatureNavigationService } from './services/feature-navigation.service';
import { AppInsightsTelemetryService } from './services/telemetry/appinsights-telemetry.service';
import { KustoTelemetryService } from './services/telemetry/kusto-telemetry.service';
import { FormComponent } from './components/form/form.component';
import { SolutionComponent } from './components/solution/solution.component';
import { SolutionsComponent } from './components/solutions/solutions.component';


@NgModule({
  imports: [
    CommonModule,
    NvD3Module,
    NgxDatatableModule,
    MarkdownModule.forRoot(),
    FormsModule,
    MonacoEditorModule.forRoot()
  ],
  providers: [
    ClipboardService
  ],
  declarations: [Nvd3GraphComponent, TimeSeriesGraphComponent, DataTableComponent, DynamicDataComponent, DataRenderBaseComponent,
    DataContainerComponent, TimeSeriesInstanceGraphComponent, DetectorViewComponent, DataSummaryComponent, EmailComponent, InsightsComponent,
    LoaderViewComponent, DynamicInsightComponent, MarkdownComponent, DetectorListComponent, DetectorOrderPipe, StarRatingComponent, StarRatingFeedbackComponent,
    DropdownComponent, StatusIconComponent, DetectorControlComponent, DetectorContainerComponent, InternalPipe, CommAlertComponent, FeedbackComponent,
    CopyInsightDetailsComponent, MarkdownEditorComponent, CardSelectionComponent, GuageGraphicComponent, GuageControlComponent, SolutionComponent, SolutionsComponent, FormComponent
  ],
  exports: [FormsModule, TimeSeriesGraphComponent, DataTableComponent, DynamicDataComponent, DetectorViewComponent, DataSummaryComponent,
    LoaderViewComponent, StatusIconComponent, DetectorControlComponent, DetectorContainerComponent, InternalPipe, CommAlertComponent, GuageControlComponent, SolutionComponent, FormComponent],
})
export class DiagnosticDataModule {
  static forRoot(config: DiagnosticDataConfig = INTERNAL_PROD_CONFIGURATION): ModuleWithProviders {
    return {
      ngModule: DiagnosticDataModule,
      providers: [
        DiagnosticService,
        { provide: DIAGNOSTIC_DATA_CONFIG, useValue: config },
        KustoTelemetryService,
        AppInsightsTelemetryService,
        TelemetryService,
        DetectorControlService,
        CommsService,
        FeatureNavigationService
      ]
    };
  }
}
