"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ResponseSummaryProps {
  totalResponses: number;
  completionRate: number;
  avgTimeToComplete: string;
  dropOffPoints: Array<{
    fieldName: string;
    dropOffRate: number;
  }>;
}

export function ResponseSummary({ 
  totalResponses, 
  completionRate, 
  avgTimeToComplete, 
  dropOffPoints 
}: ResponseSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Response Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Responses</span>
            <span className="font-semibold">{totalResponses}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg. Time to Complete</span>
            <span className="font-semibold">{avgTimeToComplete}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drop-off Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dropOffPoints.map((point, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{point.fieldName}</span>
                  <span className="text-sm font-medium text-red-600">{point.dropOffRate}%</span>
                </div>
                <Progress value={point.dropOffRate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}