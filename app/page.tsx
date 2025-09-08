"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Copy,
  Trash2,
  Download,
  Upload,
  Settings,
  Moon,
  Sun,
  Plus,
  X,
  Edit2,
  Code2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

// Monaco Editor dynamic import
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-muted">
      <div className="text-muted-foreground">Loading editor...</div>
    </div>
  ),
});

interface EditorFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  formatOnSave: boolean;
}

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript", extension: ".js" },
  { value: "python", label: "Python", extension: ".py" },
  { value: "java", label: "Java", extension: ".java" },
  { value: "cpp", label: "C++", extension: ".cpp" },
  { value: "c", label: "C", extension: ".c" },
];

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 18,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  autoSave: true,
  formatOnSave: false,
};

const DEFAULT_CODE = {
  javascript: `// Welcome to the Code Editor
console.log("Hello, World!");

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));`,
  python: `# Welcome to the Code Editor
print("Hello, World!")

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(f"Fibonacci(10): {fibonacci(10)}")`,
  java: `// Welcome to the Code Editor
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        System.out.println("Fibonacci(10): " + fibonacci(10));
    }
    
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,
  cpp: `// Welcome to the Code Editor
#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Hello, World!" << endl;
    cout << "Fibonacci(10): " << fibonacci(10) << endl;
    return 0;
}`,
  c: `// Welcome to the Code Editor
#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    printf("Hello, World!\\n");
    printf("Fibonacci(10): %d\\n", fibonacci(10));
    return 0;
}`,
};

export default function CodeEditor() {
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId);

  useEffect(() => {
    const savedFiles = localStorage.getItem("code-editor-files");
    const savedActiveId = localStorage.getItem("code-editor-active-file");
    const savedTheme = localStorage.getItem("code-editor-theme");
    const savedSettings = localStorage.getItem("code-editor-settings");

    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }

    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        setFiles(parsedFiles);
        if (
          savedActiveId &&
          parsedFiles.find((f: EditorFile) => f.id === savedActiveId)
        ) {
          setActiveFileId(savedActiveId);
        } else if (parsedFiles.length > 0) {
          setActiveFileId(parsedFiles[0].id);
        }
      } catch (error) {
        console.error("Failed to load saved files:", error);
        const defaultFile = {
          id: "1",
          name: "main.js",
          language: "javascript",
          content: DEFAULT_CODE.javascript,
        };
        setFiles([defaultFile]);
        setActiveFileId("1");
      }
    } else {
      const defaultFile = {
        id: "1",
        name: "main.js",
        language: "javascript",
        content: DEFAULT_CODE.javascript,
      };
      setFiles([defaultFile]);
      setActiveFileId("1");
    }

    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    if (files.length > 0 && settings.autoSave) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem("code-editor-files", JSON.stringify(files));
        setLastSaved(new Date());
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [files, settings.autoSave]);

  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem("code-editor-active-file", activeFileId);
    }
  }, [activeFileId]);

  useEffect(() => {
    localStorage.setItem("code-editor-theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("code-editor-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault();
            saveFile();
            break;
          case "o":
            e.preventDefault();
            loadFile();
            break;
          case "Enter":
            e.preventDefault();
            runCode();
            break;
          case "n":
            e.preventDefault();
            addNewFile();
            break;
          case ",":
            e.preventDefault();
            setIsSettingsOpen(true);
            break;
          case "f":
            e.preventDefault();
            formatCode();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFile]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure Monaco themes
    monaco.editor.defineTheme("custom-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1f2937",
      },
    });

    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0f172a",
        "editor.foreground": "#f8fafc",
      },
    });

    monaco.editor.setTheme(isDarkMode ? "custom-dark" : "custom-light");

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      setFiles(
        files.map((f) => (f.id === activeFileId ? { ...f, content: value } : f))
      );
    }
  };

  const formatCode = useCallback(async () => {
    if (!editorRef.current || !activeFile) return;

    try {
      await editorRef.current.getAction("editor.action.formatDocument").run();
    } catch (error) {
      console.error("Failed to format code:", error);
    }
  }, [activeFile]);

  const addNewFile = () => {
    const newId = Date.now().toString();
    const newFile: EditorFile = {
      id: newId,
      name: "untitled.js",
      language: "javascript",
      content: DEFAULT_CODE.javascript,
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
  };

  const closeFile = (fileId: string) => {
    if (files.length === 1) return;

    const newFiles = files.filter((f) => f.id !== fileId);
    setFiles(newFiles);

    if (activeFileId === fileId) {
      setActiveFileId(newFiles[0].id);
    }
  };

  const changeLanguage = (language: string) => {
    if (activeFile) {
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.value === language);
      const newExtension = langConfig?.extension || ".txt";
      const baseName = activeFile.name.split(".")[0];

      setFiles(
        files.map((f) =>
          f.id === activeFileId
            ? {
                ...f,
                language,
                name: baseName + newExtension,
                content:
                  DEFAULT_CODE[language as keyof typeof DEFAULT_CODE] ||
                  f.content,
              }
            : f
        )
      );
    }
  };

  const startRenaming = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file) {
      setEditingFileName(fileId);
      setNewFileName(file.name);
    }
  };

  const finishRenaming = () => {
    if (editingFileName && newFileName.trim()) {
      setFiles(
        files.map((f) =>
          f.id === editingFileName ? { ...f, name: newFileName.trim() } : f
        )
      );
    }
    setEditingFileName(null);
    setNewFileName("");
  };

  const cancelRenaming = () => {
    setEditingFileName(null);
    setNewFileName("");
  };

  const saveFile = () => {
    if (!activeFile) return;

    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const extension = file.name.split(".").pop()?.toLowerCase();

      let language = "javascript";
      if (extension === "py") language = "python";
      else if (extension === "java") language = "java";
      else if (extension === "cpp" || extension === "cc" || extension === "cxx")
        language = "cpp";
      else if (extension === "c") language = "c";
      else if (extension === "js" || extension === "mjs")
        language = "javascript";

      const newFile: EditorFile = {
        id: Date.now().toString(),
        name: file.name,
        language,
        content,
      };

      setFiles([...files, newFile]);
      setActiveFileId(newFile.id);
    };
    reader.readAsText(file);

    event.target.value = "";
  };

  const saveAllFiles = () => {
    const projectData = {
      files,
      activeFileId,
      settings,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code-editor-project.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const runCode = async () => {
    if (!activeFile) return;

    setIsRunning(true);
    setOutput("Running code...\n");

    try {
      if (activeFile.language === "javascript") {
        const originalLog = console.log;
        const originalError = console.error;
        const logs: string[] = [];

        console.log = (...args) => {
          logs.push(args.map((arg) => String(arg)).join(" "));
        };

        console.error = (...args) => {
          logs.push("Error: " + args.map((arg) => String(arg)).join(" "));
        };

        try {
          const func = new Function(activeFile.content);
          func();
          setOutput(
            logs.join("\n") || "Code executed successfully (no output)"
          );
        } catch (error) {
          setOutput(`Error: ${error}`);
        } finally {
          console.log = originalLog;
          console.error = originalError;
        }
      } else {
        const response = await fetch("/api/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: activeFile.language,
            code: activeFile.content,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setOutput(`API Error: ${result.error}\n${result.details || ""}`);
          return;
        }

        if (result.error) {
          setOutput(
            `Execution Error (Exit Code: ${result.exitCode}):\n${result.error}`
          );
        } else {
          setOutput(result.output);
        }
      }
    } catch (error) {
      setOutput(`Network Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
    }
  };

  const clearOutput = () => {
    setOutput("");
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        <input
          ref={fileInputRef}
          type="file"
          accept=".js,.py,.java,.cpp,.c,.cc,.cxx,.mjs,.txt"
          onChange={handleFileLoad}
          className="hidden"
        />

        {/* Header */}
        <header className="border-b border-border bg-card px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center pr-6">
                {/* Logo Icon */}
                <div className="w-10 h-10 flex items-center justify-center bg-transparent text-blue-500 rounded-lg shadow-lg">
                  <span className="font-bold text-2xl">{"{ }"}</span>
                </div>

                {/* Logo Text */}
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 italic">
                  CodeNova
                </h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                Multi-Language Support
              </Badge>
              {lastSaved && settings.autoSave && (
                <Badge variant="outline" className="text-xs">
                  Auto-saved {lastSaved.toLocaleTimeString()}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={activeFile?.language}
                onValueChange={changeLanguage}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        fontSize: Math.max(10, s.fontSize - 1),
                      }))
                    }
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Decrease font size</TooltipContent>
              </Tooltip>

              <span className="text-sm text-muted-foreground min-w-8 text-center">
                {settings.fontSize}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        fontSize: Math.min(24, s.fontSize + 1),
                      }))
                    }
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Increase font size</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    {isDarkMode ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>

              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Settings (Ctrl+,)</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Editor Settings</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="editor" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="editor">Editor</TabsTrigger>
                      <TabsTrigger value="project">Project</TabsTrigger>
                      <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="editor" className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>Font Size: {settings.fontSize}px</Label>
                            <Slider
                              value={[settings.fontSize]}
                              onValueChange={([value]) =>
                                setSettings((s) => ({ ...s, fontSize: value }))
                              }
                              min={10}
                              max={24}
                              step={1}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>Tab Size: {settings.tabSize}</Label>
                            <Slider
                              value={[settings.tabSize]}
                              onValueChange={([value]) =>
                                setSettings((s) => ({ ...s, tabSize: value }))
                              }
                              min={2}
                              max={8}
                              step={2}
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Word Wrap</Label>
                            <Switch
                              checked={settings.wordWrap}
                              onCheckedChange={(checked) =>
                                setSettings((s) => ({
                                  ...s,
                                  wordWrap: checked,
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Minimap</Label>
                            <Switch
                              checked={settings.minimap}
                              onCheckedChange={(checked) =>
                                setSettings((s) => ({ ...s, minimap: checked }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Line Numbers</Label>
                            <Switch
                              checked={settings.lineNumbers}
                              onCheckedChange={(checked) =>
                                setSettings((s) => ({
                                  ...s,
                                  lineNumbers: checked,
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Auto Save</Label>
                            <Switch
                              checked={settings.autoSave}
                              onCheckedChange={(checked) =>
                                setSettings((s) => ({
                                  ...s,
                                  autoSave: checked,
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Format on Save</Label>
                            <Switch
                              checked={settings.formatOnSave}
                              onCheckedChange={(checked) =>
                                setSettings((s) => ({
                                  ...s,
                                  formatOnSave: checked,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={resetSettings}
                          variant="outline"
                          className="gap-2 bg-transparent"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset to Defaults
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="project" className="space-y-4">
                      <Button onClick={saveAllFiles} className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Export Project
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Export all files and settings as a JSON project file.
                      </p>
                    </TabsContent>

                    <TabsContent value="shortcuts" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Run Code</span>
                            <Badge variant="outline">Ctrl+Enter</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Save File</span>
                            <Badge variant="outline">Ctrl+S</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Load File</span>
                            <Badge variant="outline">Ctrl+O</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>New File</span>
                            <Badge variant="outline">Ctrl+N</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Format Code</span>
                            <Badge variant="outline">Ctrl+F</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Settings</span>
                            <Badge variant="outline">Ctrl+,</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Find</span>
                            <Badge variant="outline">Ctrl+F (in editor)</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Replace</span>
                            <Badge variant="outline">Ctrl+H (in editor)</Badge>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Editor Section */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* File Tabs */}
            <div className="border-b border-border bg-muted/30 overflow-x-auto">
              <div className="flex items-center min-w-max">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer hover:bg-muted/50 group ${
                      activeFileId === file.id
                        ? "bg-background border-b-2 border-b-accent"
                        : ""
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    {editingFileName === file.id ? (
                      <Input
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onBlur={finishRenaming}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") finishRenaming();
                          if (e.key === "Escape") cancelRenaming();
                        }}
                        className="h-6 text-sm px-1 py-0 min-w-0 w-24"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenaming(file.id);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {files.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFile(file.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3 py-2"
                  onClick={addNewFile}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language={activeFile?.language}
                value={activeFile?.content}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme={isDarkMode ? "custom-dark" : "custom-light"}
                options={{
                  minimap: { enabled: settings.minimap },
                  fontSize: settings.fontSize,
                  lineNumbers: settings.lineNumbers ? "on" : "off",
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: settings.tabSize,
                  wordWrap: settings.wordWrap ? "on" : "off",
                  fontFamily: 'var(--font-mono), "Courier New", monospace',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>

            {/* Action Bar */}
            <div className="border-t border-border bg-card px-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={runCode}
                      disabled={isRunning}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {isRunning ? "Running..." : "Run"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Run code (Ctrl+Enter)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={formatCode}
                      className="gap-2 bg-transparent"
                    >
                      <Code2 className="h-4 w-4" />
                      Format
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Format code (Ctrl+F)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={copyCode}
                      className="gap-2 bg-transparent"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy code</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={saveFile}
                      className="gap-2 bg-transparent"
                    >
                      <Download className="h-4 w-4" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save file (Ctrl+S)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={loadFile}
                      className="gap-2 bg-transparent"
                    >
                      <Upload className="h-4 w-4" />
                      Load
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Load file (Ctrl+O)</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col min-h-0">
            <div className="border-b border-border px-4 py-2 flex items-center justify-between">
              <h3 className="font-medium">Output</h3>
              <Button variant="ghost" size="sm" onClick={clearOutput}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 p-4 min-h-0">
              <pre className="text-sm font-mono whitespace-pre-wrap text-foreground bg-muted/30 p-3 rounded-md h-full overflow-auto">
                {output || "Run your code to see output here..."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
