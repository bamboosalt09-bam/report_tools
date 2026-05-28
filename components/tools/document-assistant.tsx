"use client";

import { FileText, Keyboard } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyboardLayoutConverter } from "@/components/tools/keyboard-layout-converter";
import { KoreanDummyTextGenerator } from "@/components/tools/korean-dummy-text-generator";

export function DocumentAssistant() {
  return (
    <Tabs defaultValue="keyboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
        <TabsTrigger value="keyboard">
          <Keyboard className="mr-2 h-4 w-4" />
          한영 오타
        </TabsTrigger>
        <TabsTrigger value="dummy">
          <FileText className="mr-2 h-4 w-4" />
          더미 텍스트
        </TabsTrigger>
      </TabsList>
      <TabsContent value="keyboard" className="mt-4">
        <KeyboardLayoutConverter />
      </TabsContent>
      <TabsContent value="dummy" className="mt-4">
        <KoreanDummyTextGenerator />
      </TabsContent>
    </Tabs>
  );
}
