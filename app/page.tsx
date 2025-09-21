"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Download, Shuffle, Circle, Upload } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Child {
  id: string
  value: string
  color: "green" | "yellow" | "red"
}

interface Step {
  id: string
  name: string
  children: Child[]
}

interface PairwiseResult {
  [key: string]: string
}

interface PairwiseResultWithDescription extends PairwiseResult {
  Description: string
}

const colorOptions = [
  { value: "green" as const, label: "Green", class: "text-green-500" },
  { value: "yellow" as const, label: "Yellow", class: "text-yellow-500" },
  { value: "red" as const, label: "Red", class: "text-red-500" },
]

const getColorClass = (color: "green" | "yellow" | "red") => {
  switch (color) {
    case "green":
      return "text-green-500"
    case "yellow":
      return "text-yellow-500"
    case "red":
      return "text-red-500"
    default:
      return "text-yellow-500"
  }
}

const getColorBadgeClass = (color: "green" | "yellow" | "red") => {
  switch (color) {
    case "green":
      return "bg-green-100 text-green-800 border-green-200"
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "red":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
  }
}

export default function PairwiseTestingTool() {
  const [steps, setSteps] = useState<Step[]>([])
  const [pairwiseResults, setPairwiseResults] = useState<PairwiseResultWithDescription[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result
        if (typeof content !== "string") {
          throw new Error("File content is not a string.")
        }
        const data = JSON.parse(content)

        // Basic validation
        if (data && Array.isArray(data.steps) && Array.isArray(data.pairwiseResults)) {
          setSteps(data.steps)
          setPairwiseResults(data.pairwiseResults)
        } else {
          alert("Invalid JSON file format.")
        }
      } catch (error) {
        console.error("Error parsing JSON file:", error)
        alert("Error reading or parsing the JSON file.")
      }
    }
    reader.readAsText(file)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const addStep = () => {
    const newStep: Step = {
      id: `step-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      children: [],
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (stepId: string) => {
    setSteps(steps.filter((step) => step.id !== stepId))
  }

  const updateStepName = (stepId: string, newName: string) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, name: newName } : step)))
  }

  const addChild = (stepId: string) => {
    const newChild: Child = {
      id: `child-${Date.now()}`,
      value: "",
      color: "yellow", // default color
    }
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, children: [...step.children, newChild] } : step)))
  }

  const removeChild = (stepId: string, childId: string) => {
    setSteps(
      steps.map((step) =>
        step.id === stepId ? { ...step, children: step.children.filter((child) => child.id !== childId) } : step,
      ),
    )
  }

  const updateChildValue = (stepId: string, childId: string, newValue: string) => {
    setSteps(
      steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              children: step.children.map((child) => (child.id === childId ? { ...child, value: newValue } : child)),
            }
          : step,
      ),
    )
  }

  const updateChildColor = (stepId: string, childId: string, newColor: "green" | "yellow" | "red") => {
    setSteps(
      steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              children: step.children.map((child) => (child.id === childId ? { ...child, color: newColor } : child)),
            }
          : step,
      ),
    )
  }

  const generatePairwiseCombinations = () => {
    if (steps.length < 1) {
      alert("Please add at least 1 step to generate combinations.")
      return
    }

    // Process steps: if step has children with values, use them; otherwise use step name itself
    const stepValues = steps.map((step) => {
      const validChildren = step.children.filter((child) => child.value.trim() !== "")

      if (validChildren.length > 0) {
        return {
          name: step.name,
          values: validChildren.map((child) => ({
            value: child.value.trim(),
            color: child.color,
            description: `${step.name}: ${child.value.trim()}`,
          })),
        }
      } else {
        // Step without children - use step name as value
        return {
          name: step.name,
          values: [
            {
              value: step.name,
              color: "yellow" as const,
              description: step.name,
            },
          ],
        }
      }
    })

    // Generate all possible combinations (Cartesian product)
    const allCombinations: Array<{
      result: PairwiseResult
      descriptions: string[]
      colors: { [key: string]: "green" | "yellow" | "red" }
    }> = []

    const generateCombinations = (
      index: number,
      current: PairwiseResult,
      descriptions: string[],
      colors: { [key: string]: "green" | "yellow" | "red" },
    ) => {
      if (index === stepValues.length) {
        allCombinations.push({
          result: { ...current },
          descriptions: [...descriptions],
          colors: { ...colors },
        })
        return
      }

      for (const valueObj of stepValues[index].values) {
        current[stepValues[index].name] = valueObj.value
        descriptions[index] = valueObj.description
        colors[stepValues[index].name] = valueObj.color
        generateCombinations(index + 1, current, descriptions, colors)
      }
    }

    generateCombinations(0, {}, [], {})

    // For pairwise testing with improved algorithm
    const pairwiseSet = new Set<string>()
    const selectedCombinations: Array<{
      result: PairwiseResult
      descriptions: string[]
      colors: { [key: string]: "green" | "yellow" | "red" }
    }> = []

    // Add combinations that cover unique pairs
    for (const combination of allCombinations) {
      const pairs: string[] = []
      const stepNames = Object.keys(combination.result)

      // Generate all pairs for this combination
      for (let i = 0; i < stepNames.length; i++) {
        for (let j = i + 1; j < stepNames.length; j++) {
          const pair = `${stepNames[i]}:${combination.result[stepNames[i]]}-${stepNames[j]}:${combination.result[stepNames[j]]}`
          pairs.push(pair)
        }
      }

      // Check if this combination adds new pairs
      const newPairs = pairs.filter((pair) => !pairwiseSet.has(pair))
      if (newPairs.length > 0 || selectedCombinations.length === 0) {
        selectedCombinations.push(combination)
        newPairs.forEach((pair) => pairwiseSet.add(pair))
      }

      // Stop if we have good coverage (optional optimization)
      if (selectedCombinations.length >= Math.min(allCombinations.length, 50)) {
        break
      }
    }

    // Convert to final format with description
    const finalResults: PairwiseResultWithDescription[] = selectedCombinations.map((combination) => ({
      ...combination.result,
      Description: combination.descriptions.join(" | "),
      _colors: combination.colors, // Store colors for display
    }))

    setPairwiseResults(finalResults)
  }

  const exportToCSV = () => {
    if (pairwiseResults.length === 0) {
      alert("Please generate pairwise combinations first.")
      return
    }

    const headers = Object.keys(pairwiseResults[0]).filter((key) => key !== "_colors")
    const csvContent = [
      headers.join(","),
      ...pairwiseResults.map((result) => headers.map((header) => `"${result[header] || ""}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "pairwise-test-combinations.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    if (pairwiseResults.length === 0) {
      alert("Please generate pairwise combinations first.")
      return
    }

    const exportData = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      steps,
      pairwiseResults,
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `pairwise-results-${exportData.id}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pairwise Testing Tool</h1>
          <p className="text-gray-600">
            Create test steps and generate pairwise combinations for efficient testing coverage.
          </p>
        </div>

        {/* Add Step Button */}
        <div className="mb-6 flex gap-4">
          <Button onClick={addStep} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Step
          </Button>
          <Button onClick={handleImportClick} variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import from JSON
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="application/json"
          />
        </div>

        {/* Steps Container */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-8">
          {steps.map((step) => (
            <Card key={step.id} className="min-w-[300px] flex-shrink-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={step.name}
                    onChange={(e) => updateStepName(step.id, e.target.value)}
                    className="font-semibold border-none p-0 h-auto text-lg focus-visible:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(step.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-3">
                  {step.children.map((child) => (
                    <div key={child.id} className="flex items-center gap-2">
                      <Select
                        value={child.color}
                        onValueChange={(value: "green" | "yellow" | "red") =>
                          updateChildColor(step.id, child.id, value)
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((colorOption) => (
                            <SelectItem key={colorOption.value} value={colorOption.value}>
                              <div className="flex items-center gap-2">
                                <Circle className={`w-3 h-3 fill-current ${colorOption.class}`} />
                                <span>{colorOption.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={child.value}
                        onChange={(e) => updateChildValue(step.id, child.id, e.target.value)}
                        placeholder="Enter value..."
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(step.id, child.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => addChild(step.id)} className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Value
                </Button>
                {step.children.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    No values added. Step name will be used as value.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Generate and Export Buttons */}
        {steps.length > 0 && (
          <div className="flex gap-4 mb-8">
            <Button onClick={generatePairwiseCombinations} className="flex items-center gap-2" size="lg">
              <Shuffle className="w-4 h-4" />
              Generate Pairwise Combinations
            </Button>
            {pairwiseResults.length > 0 && (
              <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2" size="lg">
                <Download className="w-4 h-4" />
                Export as CSV
              </Button>
            )}
            {pairwiseResults.length > 0 && (
              <Button onClick={exportToJSON} variant="outline" className="flex items-center gap-2" size="lg">
                <Download className="w-4 h-4" />
                Export as JSON
              </Button>
            )}
          </div>
        )}

        {/* Results */}
        {pairwiseResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Pairwise Test Combinations
                <Badge variant="secondary">{pairwiseResults.length} combinations</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">#</th>
                      {Object.keys(pairwiseResults[0])
                        .filter((key) => key !== "_colors")
                        .map((header) => (
                          <th key={header} className="text-left p-2 font-semibold">
                            {header}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pairwiseResults.map((result, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-gray-500">{index + 1}</td>
                        {Object.keys(result)
                          .filter((key) => key !== "_colors")
                          .map((key) => {
                            if (key === "Description") {
                              return (
                                <td key={key} className="p-2 max-w-md">
                                  <span className="text-sm text-gray-600">{result[key]}</span>
                                </td>
                              )
                            }

                            const colors = (result as any)._colors || {}
                            const color = colors[key] || "yellow"

                            return (
                              <td key={key} className="p-2">
                                <Badge variant="outline" className={getColorBadgeClass(color)}>
                                  {result[key]}
                                </Badge>
                              </td>
                            )
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {steps.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 mb-4">
                <Shuffle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No steps created yet</h3>
                <p>Add your first step to start creating pairwise test combinations.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
