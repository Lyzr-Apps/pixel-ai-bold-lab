'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import parseLLMJson from '@/lib/jsonParser'
import { Loader2, X, RefreshCw, Check, Send, AlertCircle, Copy, Trash2, Plus, Search, Menu, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const AGENT_ID = '69890b77088744b32a9829e9'
const AGENT_NAME = 'AI Graphics Designer Agent'

interface ColorItem {
  name: string
  hex: string
  usage: string
}

interface Typography {
  headline_font: string
  body_font: string
  style_notes: string
}

interface LayoutInfo {
  structure: string
  focal_point: string
  visual_flow: string
}

interface PlatformSpecs {
  platform: string
  dimensions: string
  aspect_ratio: string
  file_format: string
  max_file_size: string
}

interface CopySuggestions {
  headline: string
  subheadline: string
  body_text: string
  call_to_action: string
  hashtags: string[]
}

interface GraphicConcept {
  concept_title: string
  visual_description: string
  color_palette: ColorItem[]
  typography: Typography
  layout: LayoutInfo
  platform_specs: PlatformSpecs
  copy_suggestions: CopySuggestions
  design_tips: string[]
}

interface SavedConcept {
  id: string
  concept: GraphicConcept
  timestamp: string
  query: string
}

const SAMPLE_CONCEPT: GraphicConcept = {
  concept_title: 'Neural Networks Made Simple',
  visual_description: 'A clean, educational Instagram graphic featuring a friendly, colorful illustration of a simplified neural network. Layered nodes are arranged from left to right, connected by glowing lines to represent data flow. Each node layer is labeled: Input, Hidden, Output. Soft gradient circles and playful iconography (lightbulbs, gears, brain) decorate the background, making the concept approachable. The overall mood is bright, modern, and welcoming -- ideal for curious beginners.',
  color_palette: [
    { name: 'Deep Indigo', hex: '#2D2B55', usage: 'Background and section dividers' },
    { name: 'Electric Teal', hex: '#00E5C7', usage: 'Neural network connections and highlights' },
    { name: 'Vivid Coral', hex: '#FF6F61', usage: 'Accent nodes, icons, and call-to-action elements' },
    { name: 'Soft Lavender', hex: '#B8B5E0', usage: 'Secondary text and subtle node fills' },
    { name: 'Clean White', hex: '#FFFFFF', usage: 'Primary text, labels, and line elements' }
  ],
  typography: {
    headline_font: 'Poppins Bold',
    body_font: 'Inter Regular',
    style_notes: 'Headline at 36pt, uppercase, tight letter-spacing. Body text at 18pt, centered, with generous line-height. Use coral for emphasis keywords in body text.'
  },
  layout: {
    structure: 'Centered vertical stack: headline at top, neural network illustration in middle third, explanatory text and labels below, hashtags and CTA at the bottom.',
    focal_point: 'The colorful neural network diagram in the center of the graphic',
    visual_flow: 'Eye starts at the bold headline, flows down to the network diagram, reads the labels left-to-right, then drops to the CTA and hashtags at the bottom.'
  },
  platform_specs: {
    platform: 'Instagram',
    dimensions: '1080x1080',
    aspect_ratio: '1:1',
    file_format: 'PNG',
    max_file_size: '5MB'
  },
  copy_suggestions: {
    headline: 'Neural Networks Made Simple',
    subheadline: 'Your Friendly Guide to How AI Learns',
    body_text: 'Neural networks mimic the human brain to process data, learn patterns, and make predictions. It all starts with layers of connected nodes!',
    call_to_action: 'Save This & Start Your AI Journey',
    hashtags: ['#NeuralNetworks', '#AIForBeginners', '#MachineLearning', '#TechEducation', '#DeepLearning']
  },
  design_tips: [
    'Use subtle drop shadows and glows on the neural network nodes to give them a 3D, tactile feel that draws attention.',
    'Animate the connections between nodes if posting as a Reel or Story for added engagement.',
    'Keep the diagram simplified -- no more than 3 layers with 3-4 nodes each -- to maintain clarity for beginners.'
  ]
}

const EXAMPLE_PROMPTS = [
  'Create a LinkedIn post about GPT-5 features',
  'Design an Instagram carousel about machine learning basics',
  'Twitter/X banner for an AI startup launch',
  'Facebook post about the future of autonomous vehicles'
]

const PLATFORM_DIMENSIONS: Record<string, { dimensions: string; ratio: string }> = {
  LinkedIn: { dimensions: '1200x627', ratio: '1.91:1' },
  'Twitter/X': { dimensions: '1600x900', ratio: '16:9' },
  Instagram: { dimensions: '1080x1080', ratio: '1:1' },
  Facebook: { dimensions: '1200x630', ratio: '1.91:1' }
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error('Error reading localStorage:', error)
    }
  }, [key])

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prev => {
        const newValue = value instanceof Function ? value(prev) : value
        window.localStorage.setItem(key, JSON.stringify(newValue))
        return newValue
      })
    } catch (error) {
      console.error('Error setting localStorage:', error)
    }
  }, [key])

  return [storedValue, setValue]
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 rounded bg-muted/50 w-3/4" />
      <div className="space-y-2">
        <div className="h-4 rounded bg-muted/50 w-full" />
        <div className="h-4 rounded bg-muted/50 w-5/6" />
        <div className="h-4 rounded bg-muted/50 w-4/6" />
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-12 h-12 rounded-full bg-muted/50" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 rounded bg-muted/50" />
        <div className="h-32 rounded bg-muted/50" />
      </div>
      <div className="h-40 rounded bg-muted/50" />
    </div>
  )
}

function ColorSwatch({ color }: { color: ColorItem }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(color?.hex ?? '')
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <button onClick={handleCopy} className="flex flex-col items-center gap-1.5 group cursor-pointer" title={`Copy ${color?.hex ?? ''}`}>
      <div className="w-14 h-14 rounded-full border-2 border-white/10 shadow-[0_0_10px_rgba(0,255,255,0.15)] group-hover:shadow-[0_0_18px_rgba(0,255,255,0.35)] transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: color?.hex ?? '#333' }} />
      <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">{copied ? 'Copied!' : (color?.hex ?? '')}</span>
      <span className="text-[9px] text-muted-foreground max-w-[70px] text-center leading-tight">{color?.name ?? ''}</span>
    </button>
  )
}

function ConceptDisplay({ concept, onSave, onVariation, query }: { concept: GraphicConcept; onSave: () => void; onVariation: () => void; query: string }) {
  const [allCopied, setAllCopied] = useState(false)

  const formatConceptText = () => {
    const lines: string[] = []
    lines.push(`CONCEPT: ${concept?.concept_title ?? 'Untitled'}`)
    lines.push('')
    lines.push(`VISUAL DESCRIPTION:`)
    lines.push(concept?.visual_description ?? '')
    lines.push('')
    lines.push(`COLOR PALETTE:`)
    const palette = Array.isArray(concept?.color_palette) ? concept.color_palette : []
    palette.forEach(c => {
      lines.push(`  ${c?.name ?? ''} (${c?.hex ?? ''}) - ${c?.usage ?? ''}`)
    })
    lines.push('')
    lines.push(`TYPOGRAPHY:`)
    lines.push(`  Headline: ${concept?.typography?.headline_font ?? ''}`)
    lines.push(`  Body: ${concept?.typography?.body_font ?? ''}`)
    lines.push(`  Notes: ${concept?.typography?.style_notes ?? ''}`)
    lines.push('')
    lines.push(`LAYOUT:`)
    lines.push(`  Structure: ${concept?.layout?.structure ?? ''}`)
    lines.push(`  Focal Point: ${concept?.layout?.focal_point ?? ''}`)
    lines.push(`  Visual Flow: ${concept?.layout?.visual_flow ?? ''}`)
    lines.push('')
    lines.push(`PLATFORM: ${concept?.platform_specs?.platform ?? ''} | ${concept?.platform_specs?.dimensions ?? ''} | ${concept?.platform_specs?.aspect_ratio ?? ''}`)
    lines.push('')
    lines.push(`COPY SUGGESTIONS:`)
    lines.push(`  Headline: ${concept?.copy_suggestions?.headline ?? ''}`)
    lines.push(`  Subheadline: ${concept?.copy_suggestions?.subheadline ?? ''}`)
    lines.push(`  Body: ${concept?.copy_suggestions?.body_text ?? ''}`)
    lines.push(`  CTA: ${concept?.copy_suggestions?.call_to_action ?? ''}`)
    const hashtags = Array.isArray(concept?.copy_suggestions?.hashtags) ? concept.copy_suggestions.hashtags : []
    lines.push(`  Hashtags: ${hashtags.join(' ')}`)
    lines.push('')
    lines.push(`DESIGN TIPS:`)
    const tips = Array.isArray(concept?.design_tips) ? concept.design_tips : []
    tips.forEach((tip, i) => {
      lines.push(`  ${i + 1}. ${tip}`)
    })
    return lines.join('\n')
  }

  const handleCopyAll = async () => {
    const success = await copyToClipboard(formatConceptText())
    if (success) {
      setAllCopied(true)
      setTimeout(() => setAllCopied(false), 2000)
    }
  }

  const palette = Array.isArray(concept?.color_palette) ? concept.color_palette : []
  const hashtags = Array.isArray(concept?.copy_suggestions?.hashtags) ? concept.copy_suggestions.hashtags : []
  const tips = Array.isArray(concept?.design_tips) ? concept.design_tips : []

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight" style={{ textShadow: '0 0 20px rgba(0,255,255,0.5), 0 0 40px rgba(0,255,255,0.2)' }}>
          {concept?.concept_title ?? 'Untitled Concept'}
        </h2>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onSave} className="border-cyan-700/50 hover:border-cyan-500/70 hover:shadow-[0_0_10px_rgba(0,255,255,0.2)]">
            <Plus className="w-3.5 h-3.5 mr-1" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="border-cyan-700/50 hover:border-cyan-500/70 hover:shadow-[0_0_10px_rgba(0,255,255,0.2)]">
            {allCopied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {allCopied ? 'Copied' : 'Copy All'}
          </Button>
          <Button variant="outline" size="sm" onClick={onVariation} className="border-fuchsia-700/50 hover:border-fuchsia-500/70 hover:shadow-[0_0_10px_rgba(255,0,255,0.2)]">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Variation
          </Button>
        </div>
      </div>

      <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Visual Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">{concept?.visual_description ?? ''}</p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Color Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-5 justify-start">
            {palette.map((color, idx) => (
              <ColorSwatch key={idx} color={color} />
            ))}
          </div>
          {palette.length > 0 && (
            <div className="mt-4 space-y-1">
              {palette.map((color, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color?.hex ?? '#333' }} />
                  <span className="font-mono">{color?.hex ?? ''}</span>
                  <span className="text-white/30">|</span>
                  <span>{color?.usage ?? ''}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">Headline Font</span>
              <p className="text-sm font-semibold">{concept?.typography?.headline_font ?? 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Body Font</span>
              <p className="text-sm font-semibold">{concept?.typography?.body_font ?? 'N/A'}</p>
            </div>
            <Separator className="bg-white/5" />
            <div>
              <span className="text-xs text-muted-foreground">Style Notes</span>
              <p className="text-xs leading-relaxed text-foreground/80">{concept?.typography?.style_notes ?? ''}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">Structure</span>
              <p className="text-xs leading-relaxed text-foreground/80">{concept?.layout?.structure ?? 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Focal Point</span>
              <p className="text-xs leading-relaxed text-foreground/80">{concept?.layout?.focal_point ?? 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Visual Flow</span>
              <p className="text-xs leading-relaxed text-foreground/80">{concept?.layout?.visual_flow ?? 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Platform Specs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-500/30">{concept?.platform_specs?.platform ?? 'N/A'}</Badge>
            <Badge variant="outline" className="border-cyan-700/50 text-cyan-300">{concept?.platform_specs?.dimensions ?? ''}</Badge>
            <Badge variant="outline" className="border-cyan-700/50 text-cyan-300">{concept?.platform_specs?.aspect_ratio ?? ''}</Badge>
            <Badge variant="outline" className="border-cyan-700/50 text-cyan-300">{concept?.platform_specs?.file_format ?? ''}</Badge>
            <Badge variant="outline" className="border-cyan-700/50 text-cyan-300">Max: {concept?.platform_specs?.max_file_size ?? ''}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Copy Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Headline</span>
            <p className="text-lg font-bold" style={{ textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>{concept?.copy_suggestions?.headline ?? ''}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Subheadline</span>
            <p className="text-sm font-medium text-foreground/90">{concept?.copy_suggestions?.subheadline ?? ''}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Body Text</span>
            <p className="text-sm text-foreground/80 leading-relaxed">{concept?.copy_suggestions?.body_text ?? ''}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Call to Action</span>
            <div className="inline-block px-4 py-2 rounded bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 text-sm font-semibold">
              {concept?.copy_suggestions?.call_to_action ?? ''}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Hashtags</span>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs border-yellow-600/40 text-yellow-300/90 hover:bg-yellow-500/10 cursor-default">{tag}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Design Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">{idx + 1}</span>
                <p className="text-sm text-foreground/85 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState('LinkedIn')
  const [aspectRatio, setAspectRatio] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentConcept, setCurrentConcept] = useState<GraphicConcept | null>(null)
  const [currentQuery, setCurrentQuery] = useState('')
  const [savedConcepts, setSavedConcepts] = useLocalStorage<SavedConcept[]>('graphics-studio-saved', [])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [showSampleData, setShowSampleData] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  useEffect(() => {
    if (showSampleData && !currentConcept) {
      setCurrentConcept(SAMPLE_CONCEPT)
      setCurrentQuery('Create an Instagram post about neural networks for beginners')
      setPrompt('Create an Instagram post about neural networks for beginners')
      setPlatform('Instagram')
    } else if (!showSampleData && currentConcept === SAMPLE_CONCEPT) {
      setCurrentConcept(null)
      setCurrentQuery('')
      setPrompt('')
      setPlatform('LinkedIn')
    }
  }, [showSampleData])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)

    const dims = PLATFORM_DIMENSIONS[platform]
    let fullMessage = prompt.trim()
    if (platform) {
      fullMessage += ` | Platform: ${platform}`
      if (dims) {
        fullMessage += ` (${dims.dimensions}, ${dims.ratio})`
      }
    }
    if (aspectRatio) {
      fullMessage += ` | Aspect Ratio: ${aspectRatio}`
    }

    try {
      const result = await callAIAgent(fullMessage, AGENT_ID)
      if (result.success && result?.response?.status === 'success') {
        const rawResult = result.response.result
        let parsed = rawResult
        if (typeof rawResult === 'string') {
          parsed = parseLLMJson(rawResult)
        } else if (rawResult && typeof rawResult === 'object') {
          if (rawResult.concept_title) {
            parsed = rawResult
          } else {
            parsed = parseLLMJson(rawResult)
          }
        }
        if (parsed && parsed.concept_title) {
          setCurrentConcept(parsed as GraphicConcept)
          setCurrentQuery(prompt.trim())
        } else {
          setError('The agent response could not be parsed into a valid graphic concept. Please try again.')
        }
      } else {
        setError(result?.error ?? result?.response?.message ?? 'Failed to generate concept. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleVariation = async () => {
    if (!currentQuery.trim()) return
    setIsLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)

    const variationMessage = currentQuery + ' - give me a different variation with a fresh perspective'

    try {
      const result = await callAIAgent(variationMessage, AGENT_ID)
      if (result.success && result?.response?.status === 'success') {
        const rawResult = result.response.result
        let parsed = rawResult
        if (typeof rawResult === 'string') {
          parsed = parseLLMJson(rawResult)
        } else if (rawResult && typeof rawResult === 'object') {
          if (rawResult.concept_title) {
            parsed = rawResult
          } else {
            parsed = parseLLMJson(rawResult)
          }
        }
        if (parsed && parsed.concept_title) {
          setCurrentConcept(parsed as GraphicConcept)
        } else {
          setError('Could not parse the variation response. Please try again.')
        }
      } else {
        setError(result?.error ?? 'Failed to generate variation.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleSave = () => {
    if (!currentConcept) return
    const saved: SavedConcept = {
      id: Date.now().toString(),
      concept: currentConcept,
      timestamp: new Date().toISOString(),
      query: currentQuery
    }
    setSavedConcepts(prev => [saved, ...prev])
  }

  const handleLoadSaved = (saved: SavedConcept) => {
    setCurrentConcept(saved.concept)
    setCurrentQuery(saved.query)
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  const handleDeleteSaved = (id: string) => {
    setSavedConcepts(prev => {
      const arr = Array.isArray(prev) ? prev : []
      return arr.filter(s => s.id !== id)
    })
  }

  const handleExampleClick = (example: string) => {
    setPrompt(example)
    const platformMatch = example.toLowerCase()
    if (platformMatch.includes('linkedin')) setPlatform('LinkedIn')
    else if (platformMatch.includes('instagram')) setPlatform('Instagram')
    else if (platformMatch.includes('twitter') || platformMatch.includes('x ')) setPlatform('Twitter/X')
    else if (platformMatch.includes('facebook')) setPlatform('Facebook')
  }

  const filteredSaved = Array.isArray(savedConcepts) ? savedConcepts.filter(s => {
    if (!searchFilter.trim()) return true
    const term = searchFilter.toLowerCase()
    return (s?.concept?.concept_title ?? '').toLowerCase().includes(term) || (s?.query ?? '').toLowerCase().includes(term)
  }) : []

  const aspectRatios = ['1:1', '16:9', '9:16', '4:5']

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, hsl(260, 35%, 8%) 0%, hsl(280, 30%, 10%) 50%, hsl(240, 25%, 8%) 100%)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed top-0 left-0 h-full z-50 w-80 border-r border-white/10 backdrop-blur-[12px] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'linear-gradient(180deg, hsl(260, 30%, 8%) 0%, hsl(260, 25%, 6%) 100%)' }}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Saved Concepts</h3>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search saved..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-8 h-9 text-xs bg-muted/30 border-white/10" />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-3 space-y-2">
            {filteredSaved.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No saved concepts yet</p>
            )}
            {filteredSaved.map(saved => (
              <Card key={saved.id} className="backdrop-blur-[12px] bg-white/5 border-white/10 cursor-pointer hover:border-cyan-500/30 hover:shadow-[0_0_10px_rgba(0,255,255,0.1)] transition-all duration-200" onClick={() => handleLoadSaved(saved)}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{saved?.concept?.concept_title ?? 'Untitled'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-fuchsia-500/30 text-fuchsia-300">{saved?.concept?.platform_specs?.platform ?? ''}</Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(saved?.timestamp ?? '').toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteSaved(saved.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-[12px] border-b border-white/10" style={{ background: 'rgba(15, 10, 30, 0.7)' }}>
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="hover:bg-white/5">
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Mono', monospace", textShadow: '0 0 25px rgba(0,255,255,0.6), 0 0 50px rgba(0,255,255,0.2)' }}>
                AI Graphics Studio
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">Generate stunning social media graphics for tech & AI content</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
            <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={setShowSampleData} />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <Card className="backdrop-blur-[12px] bg-card/50 border-white/10 shadow-[0_0_15px_rgba(0,255,255,0.08)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Describe Your Graphic</CardTitle>
                <CardDescription className="text-xs text-muted-foreground/70">Tell us what kind of social media graphic you want to create and we will generate a complete design concept.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="Describe your graphic idea... e.g., 'A LinkedIn post showcasing how AI transforms healthcare with futuristic visuals'" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[100px] bg-muted/20 border-white/10 resize-none text-sm placeholder:text-muted-foreground/40 focus:border-cyan-500/40 focus:shadow-[0_0_10px_rgba(0,255,255,0.1)]" />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-muted/20 border-white/10 text-sm">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-white/10">
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Aspect Ratio (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {aspectRatios.map(ratio => (
                      <button key={ratio} onClick={() => setAspectRatio(aspectRatio === ratio ? '' : ratio)} className={`px-3 py-1.5 text-xs font-mono rounded border transition-all duration-200 ${aspectRatio === ratio ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_8px_rgba(0,255,255,0.2)]' : 'bg-muted/20 border-white/10 text-muted-foreground hover:border-white/20'}`}>
                      {ratio}
                    </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-semibold shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all duration-300 disabled:opacity-50 disabled:shadow-none">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Generate Concept
                    </>
                  )}
                </Button>

                {currentConcept && !isLoading && (
                  <Button variant="outline" onClick={handleVariation} className="w-full border-fuchsia-700/50 text-fuchsia-300 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/50 hover:shadow-[0_0_10px_rgba(255,0,255,0.15)]">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Get Variation
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Quick Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.map((example, idx) => (
                    <button key={idx} onClick={() => handleExampleClick(example)} className="w-full text-left px-3 py-2 text-xs rounded border border-white/5 bg-white/[0.02] hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all duration-200 text-foreground/70 hover:text-foreground">
                      {example}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-[12px] bg-card/50 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Info className="w-3 h-3" /> Agent Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === AGENT_ID ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(255,255,0,0.5)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(0,255,128,0.3)]'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{AGENT_NAME}</p>
                    <p className="text-[10px] text-muted-foreground">{activeAgentId === AGENT_ID ? 'Processing request...' : 'Ready'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            {error && (
              <Card className="mb-4 backdrop-blur-[12px] bg-red-500/10 border-red-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-300 font-medium">Error</p>
                    <p className="text-xs text-red-300/80 mt-1">{error}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto h-6 w-6 p-0 text-red-400 hover:text-red-300">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card className="backdrop-blur-[12px] bg-card/50 border-cyan-500/20 shadow-[0_0_20px_rgba(0,255,255,0.1)] animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <p className="text-sm text-cyan-300 font-mono">Generating your concept...</p>
                  </div>
                  <SkeletonLoader />
                </CardContent>
              </Card>
            )}

            {!isLoading && !currentConcept && (
              <Card className="backdrop-blur-[12px] bg-card/50 border-white/10 min-h-[500px] flex items-center justify-center">
                <CardContent className="text-center py-20 px-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-cyan-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ textShadow: '0 0 15px rgba(0,255,255,0.3)' }}>Your graphic concepts will appear here</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">Describe the social media graphic you need -- include the topic, platform, and any style preferences. The AI will generate a complete design concept with colors, typography, layout, and copy.</p>
                </CardContent>
              </Card>
            )}

            {!isLoading && currentConcept && (
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="pr-4">
                  <ConceptDisplay concept={currentConcept} onSave={handleSave} onVariation={handleVariation} query={currentQuery} />
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
