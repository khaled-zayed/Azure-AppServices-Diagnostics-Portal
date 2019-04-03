import { Rendering, DiagnosticData, HealthStatus, RenderingType, DetectorResponse } from './detector';
import { Solution } from '../components/solution/solution.component';

export class InsightBase {
    status: HealthStatus;
    title: string;

    constructor(status: string, title: string) {
        this.title = title;
        this.status = HealthStatus[status];
    }
}

export class Insight extends InsightBase {

    data: Map<string, string>;
    isExpanded: boolean = false;
    isRated: boolean = false;
    isHelpful: boolean = false;
    solutions: Solution[] = null;

    constructor(status: string, title: string, isExpanded: boolean, solutions?: Solution[]) {
        super(status, title);
        this.data = new Map<string, string>();
        this.isExpanded = isExpanded;
        if (solutions) {
            this.solutions = solutions;
        }
    }

    getKeys(): string[] {
        return Object.keys(this.data);
    }

    hasData(): boolean {
        return Object.keys(this.data).length > 0;
    }
}

export class InsightUtils {
    static parseAllInsightsFromResponse(response: DetectorResponse): Insight[] {
        let insightDiagnosticData = response.dataset.filter(data => (<Rendering>data.renderingProperties).type === RenderingType.Insights);

        let allInsights: Insight[] = [];

        insightDiagnosticData.forEach((diagnosticData: DiagnosticData) => {
            let insights = this.parseInsightRendering(diagnosticData);
            insights.forEach(insight => allInsights.push(insight));
        });

        return allInsights;
    }

    static parseInsightRendering(diagnosticData: DiagnosticData): Insight[] {
        const insights: Insight[] = [];
        const data = diagnosticData.table;

        const statusColumnIndex = 0;
        const insightColumnIndex = 1;
        const nameColumnIndex = 2;
        const valueColumnIndex = 3;
        const isExpandedIndex = 4;
        const solutionsIndex = 5;

        for (let i: number = 0; i < data.rows.length; i++) {
            let insight: Insight;
            const row = data.rows[i];
            const insightName = row[insightColumnIndex];
            const nameColumnValue = row[nameColumnIndex];
            
            let solutionsValue = null;
            if (solutionsIndex < row.length) {
                solutionsValue = <Solution[]>JSON.parse(row[solutionsIndex]);
            }

            if ((insight = insights.find(ins => ins.title === insightName)) == null) {
                const isExpanded: boolean = row.length > isExpandedIndex ? row[isExpandedIndex].toLowerCase() === 'true' : false;
                insight = new Insight(row[statusColumnIndex], insightName, isExpanded, solutionsValue);
                insights.push(insight);
            }

            if (nameColumnValue && nameColumnValue.length > 0) {
                insight.data[nameColumnValue] = row[valueColumnIndex];
            }
        }

        return insights;
    }
}

export class DynamicInsight extends InsightBase {
    description: string;
    innerDiagnosticData: DiagnosticData;
    expanded: boolean;
}
