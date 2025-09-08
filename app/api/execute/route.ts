import { type NextRequest, NextResponse } from "next/server"

interface ExecuteRequest {
  language: string
  code: string
}

interface PistonResponse {
  run: {
    stdout: string
    stderr: string
    code: number
    signal: string | null
  }
}

// Language mapping for Piston API
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
}

export async function POST(request: NextRequest) {
  try {
    const { language, code }: ExecuteRequest = await request.json()

    if (!code || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 })
    }

    // Handle JavaScript execution (should be done client-side)
    if (language === "javascript") {
      return NextResponse.json({ error: "JavaScript should be executed client-side" }, { status: 400 })
    }

    const langConfig = LANGUAGE_MAP[language]
    if (!langConfig) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 })
    }

    // Use Piston API for code execution
    const pistonResponse = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [
          {
            name: language === "java" ? "Main.java" : `main.${language === "cpp" ? "cpp" : language}`,
            content: code,
          },
        ],
      }),
    })

    if (!pistonResponse.ok) {
      throw new Error(`Piston API error: ${pistonResponse.statusText}`)
    }

    const result: PistonResponse = await pistonResponse.json()

    let output = ""
    if (result.run.stdout) {
      output += result.run.stdout
    }
    if (result.run.stderr) {
      output += result.run.stderr
    }

    if (!output && result.run.code === 0) {
      output = "Code executed successfully (no output)"
    }

    return NextResponse.json({
      output: output || "No output",
      exitCode: result.run.code,
      error: result.run.code !== 0 ? result.run.stderr : null,
    })
  } catch (error) {
    console.error("Code execution error:", error)
    return NextResponse.json(
      {
        error: "Failed to execute code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
