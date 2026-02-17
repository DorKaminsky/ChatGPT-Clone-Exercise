import { ChartData, VisualizationSpec } from './types';

/**
 * ChartSpecGenerator - Transforms raw data into Recharts-compatible formats
 *
 * Handles data transformation for:
 * - Bar Charts: { name: string, value: number }[]
 * - Pie Charts: { name: string, value: number }[]
 * - Line Charts: { x: string|number, y: number }[]
 * - Tables: Pass-through (no transformation)
 */
export class ChartSpecGenerator {
  /**
   * Main entry point for generating chart specifications
   * @param type Chart type (bar, pie, line, table)
   * @param data Raw data array from query results
   * @param mapping Data mapping from VisualizationSpec
   * @returns ChartData object ready for ChartRenderer
   */
  generateSpec(
    type: 'bar' | 'pie' | 'line' | 'scatter' | 'table',
    data: any[],
    mapping: VisualizationSpec['dataMapping']
  ): ChartData {
    // Validate inputs
    if (!data || data.length === 0) {
      return this.createEmptyChart(type, 'No data available');
    }

    try {
      switch (type) {
        case 'bar':
          return this.generateBarChart(data, mapping);
        case 'pie':
          return this.generatePieChart(data, mapping);
        case 'line':
          return this.generateLineChart(data, mapping);
        case 'table':
          return this.generateTableChart(data, mapping);
        case 'scatter':
          return this.generateScatterChart(data, mapping);
        default:
          throw new Error(`Unsupported chart type: ${type}`);
      }
    } catch (error) {
      console.error('Error generating chart spec:', error);
      return this.createEmptyChart(type, 'Error generating chart');
    }
  }

  /**
   * Generate Bar Chart specification
   * Format: [{ name: string, value: number }, ...]
   */
  private generateBarChart(
    data: any[],
    mapping: VisualizationSpec['dataMapping']
  ): ChartData {
    const nameField = mapping.nameField || mapping.xAxis || 'name';
    const valueField = mapping.valueField || mapping.yAxis || 'value';

    const transformedData = data
      .map((item, index) => {
        const name = this.extractValue(item, nameField, `Item ${index + 1}`);
        const value = this.extractNumericValue(item, valueField, 0);

        return {
          name: String(name),
          value: Number(value),
        };
      })
      .filter(item => item.value !== null && !isNaN(item.value));

    return {
      type: 'bar',
      data: transformedData,
      config: {
        xAxis: nameField,
        yAxis: valueField,
        labels: transformedData.map(d => d.name),
      },
    };
  }

  /**
   * Generate Pie Chart specification
   * Format: [{ name: string, value: number }, ...]
   */
  private generatePieChart(
    data: any[],
    mapping: VisualizationSpec['dataMapping']
  ): ChartData {
    const nameField = mapping.nameField || mapping.xAxis || 'name';
    const valueField = mapping.valueField || mapping.yAxis || 'value';

    const transformedData = data
      .map((item, index) => {
        const name = this.extractValue(item, nameField, `Category ${index + 1}`);
        const value = this.extractNumericValue(item, valueField, 0);

        return {
          name: String(name),
          value: Number(value),
        };
      })
      .filter(item => item.value !== null && !isNaN(item.value) && item.value > 0);

    return {
      type: 'pie',
      data: transformedData,
      config: {
        labels: transformedData.map(d => d.name),
      },
    };
  }

  /**
   * Generate Line Chart specification
   * Format: [{ x: string|number, y: number }, ...]
   */
  private generateLineChart(
    data: any[],
    mapping: VisualizationSpec['dataMapping']
  ): ChartData {
    const xField = mapping.xAxis || 'x';
    const yField = mapping.yAxis || 'y';

    const transformedData = data
      .map((item, index) => {
        const x = this.extractValue(item, xField, index);
        const y = this.extractNumericValue(item, yField, 0);

        return {
          x: this.formatXValue(x),
          y: Number(y),
        };
      })
      .filter(item => item.y !== null && !isNaN(item.y));

    return {
      type: 'line',
      data: transformedData,
      config: {
        xAxis: xField,
        yAxis: yField,
      },
    };
  }

  /**
   * Generate Scatter Chart specification (similar to line)
   * Format: [{ x: number, y: number }, ...]
   */
  private generateScatterChart(
    data: any[],
    mapping: VisualizationSpec['dataMapping']
  ): ChartData {
    const xField = mapping.xAxis || 'x';
    const yField = mapping.yAxis || 'y';

    const transformedData = data
      .map((item) => {
        const x = this.extractNumericValue(item, xField, 0);
        const y = this.extractNumericValue(item, yField, 0);

        return {
          x: Number(x),
          y: Number(y),
        };
      })
      .filter(item => !isNaN(item.x) && !isNaN(item.y));

    return {
      type: 'scatter',
      data: transformedData,
      config: {
        xAxis: xField,
        yAxis: yField,
      },
    };
  }

  /**
   * Generate Table Chart specification (pass-through)
   * Returns raw data for table rendering
   */
  private generateTableChart(
    data: any[],
    mapping: VisualizationSpec['dataMapping']
  ): ChartData {
    // For tables, we pass through the data as-is
    return {
      type: 'table',
      data: data,
      config: {},
    };
  }

  /**
   * Extract value from object by field name
   * Supports nested fields with dot notation (e.g., 'user.name')
   */
  private extractValue(obj: any, field: string, defaultValue: any = null): any {
    if (!obj || !field) return defaultValue;

    // Handle nested fields (e.g., 'user.name')
    const parts = field.split('.');
    let value = obj;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }

    return value !== undefined && value !== null ? value : defaultValue;
  }

  /**
   * Extract numeric value from object
   * Handles string-to-number conversion
   */
  private extractNumericValue(obj: any, field: string, defaultValue: number = 0): number {
    const value = this.extractValue(obj, field, defaultValue);

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      // Remove common formatting (commas, currency symbols)
      const cleaned = value.replace(/[,$]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? defaultValue : parsed;
    }

    return defaultValue;
  }

  /**
   * Format x-axis value for line charts
   * Handles dates, numbers, and strings
   */
  private formatXValue(value: any): string | number {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      // Try to parse as date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      return value;
    }

    return String(value);
  }

  /**
   * Create empty chart for error cases
   */
  private createEmptyChart(type: ChartData['type'], message: string): ChartData {
    return {
      type,
      data: [],
      config: {
        title: message,
      },
    };
  }
}

// Export singleton instance
export const chartSpecGenerator = new ChartSpecGenerator();
