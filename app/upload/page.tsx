'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/useSupabase'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Calculator, CheckCircle, AlertCircle } from 'lucide-react'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = useSupabase()

  // 处理文件上传
  const handleFileUpload = async (file: File, type: 'cities' | 'salaries') => {
    setUploading(true)
    setMessage(null)

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])

      if (type === 'cities') {
        // 插入城市数据
        if (!supabase) throw new Error('Supabase client not initialized')

        const { error } = await supabase
          .from('cities')
          .insert(data)

        if (error) throw error
        setMessage({ type: 'success', text: '城市数据上传成功！' })
      } else {
        // 插入员工工资数据
        if (!supabase) throw new Error('Supabase client not initialized')

        const { error } = await supabase
          .from('salaries')
          .insert(data)

        if (error) throw error
        setMessage({ type: 'success', text: '员工工资数据上传成功！' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: `上传失败: ${error instanceof Error ? error.message : '未知错误'}` })
    } finally {
      setUploading(false)
    }
  }

  // 处理文件选择
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'cities' | 'salaries') => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file, type)
    }
  }

  // 执行计算
  const handleCalculate = async () => {
    setCalculating(true)
    setMessage(null)

    try {
      // 1. 计算每位员工的年度月平均工资
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data: salaries, error: salaryError } = await supabase
        .from('salaries')
        .select('employee_name, salary_amount, month')

      if (salaryError) throw salaryError

      // 按员工分组计算平均工资
      const avgSalaries = salaries?.reduce((acc, salary) => {
        if (!acc[salary.employee_name]) {
          acc[salary.employee_name] = {
            total: 0,
            count: 0
          }
        }
        acc[salary.employee_name].total += salary.salary_amount
        acc[salary.employee_name].count += 1
        return acc
      }, {} as Record<string, { total: number; count: number }>) || {}

      // 计算平均工资
      const employees = Object.entries(avgSalaries).map(([name, data]) => ({
        name,
        avg_salary: data.total / data.count
      }))

      // 2. 获取佛山的标准（假设使用佛山）
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('base_min, base_max, rate')
        .eq('city_name', '佛山')
        .eq('year', '2024')
        .single()

      if (cityError) throw cityError

      // 3. 计算每个人的缴费基数和公司应缴金额
      const results = employees.map(employee => {
        const avgSalary = employee.avg_salary
        const base = cityData!

        let contributionBase: number
        if (avgSalary < base.base_min) {
          contributionBase = base.base_min
        } else if (avgSalary > base.base_max) {
          contributionBase = base.base_max
        } else {
          contributionBase = avgSalary
        }

        const companyFee = contributionBase * base.rate

        return {
          employee_name: employee.name,
          avg_salary: Math.round(employee.avg_salary * 100) / 100,
          contribution_base: Math.round(contributionBase * 100) / 100,
          company_fee: Math.round(companyFee * 100) / 100
        }
      })

      // 4. 清空旧结果并插入新结果
      await supabase.from('results').delete().neq('id', 0)

      const { error: insertError } = await supabase
        .from('results')
        .insert(results)

      if (insertError) throw insertError

      setMessage({ type: 'success', text: `计算完成！共计算了 ${results.length} 名员工的社保费用。` })
    } catch (error) {
      console.error('Calculation error:', error)
      setMessage({ type: 'error', text: `计算失败: ${error instanceof Error ? error.message : '未知错误'}` })
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            数据上传与计算
          </h1>
          <p className="text-gray-600">
            上传数据文件并执行社保计算
          </p>
        </div>

        {/* Upload Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Cities Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                城市标准数据
              </CardTitle>
              <CardDescription>
                上传城市社保标准文件 (@cities.xlsx)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange(e, 'cities')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500">
                  文件格式：Excel (.xlsx, .xls)<br/>
                  字段：city_name, year, base_min, base_max, rate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Salaries Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                员工工资数据
              </CardTitle>
              <CardDescription>
                上传员工工资数据文件 (salaries.xlsx)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange(e, 'salaries')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500">
                  文件格式：Excel (.xlsx, .xls)<br/>
                  字段：employee_id, employee_name, month, salary_amount
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calculate Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleCalculate}
            disabled={calculating}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            {calculating ? (
              <>
                <Calculator className="mr-2 h-5 w-5 animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-5 w-5" />
                执行计算并存储结果
              </>
            )}
          </Button>
        </div>

        {/* Message */}
        {message && (
          <Alert className={`${
            message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>首先上传 @cities.xlsx 文件，包含城市社保标准数据</li>
              <li>然后上传 salaries.xlsx 文件，包含员工工资数据</li>
              <li>点击"执行计算并存储结果"按钮进行计算</li>
              <li>计算完成后，可以到结果页面查看计算结果</li>
              <li>Excel 文件需包含对应的字段，字段名需与数据库字段名一致</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}