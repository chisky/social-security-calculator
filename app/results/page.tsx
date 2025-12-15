'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, RefreshCw } from 'lucide-react'

// 定义数据类型
interface ResultData {
  employee_name: string
  avg_salary: number
  contribution_base: number
  company_fee: number
  created_at: string
}

export default function ResultsPage() {
  const [data, setData] = useState<ResultData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: results, error } = await supabase
        .from('results')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setData(results || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 导出为Excel
  const exportToExcel = () => {
    // 创建Excel内容
    const excelData = data.map(item => ({
      '员工姓名': item.employee_name,
      '月平均工资': item.avg_salary,
      '缴费基数': item.contribution_base,
      '公司应缴金额': item.company_fee,
      '计算时间': new Date(item.created_at).toLocaleString('zh-CN')
    }))

    // 创建工作簿
    const worksheet = [
      ['员工姓名', '月平均工资', '缴费基数', '公司应缴金额', '计算时间'],
      ...data.map(item => [
        item.employee_name,
        item.avg_salary.toString(),
        item.contribution_base.toString(),
        item.company_fee.toString(),
        new Date(item.created_at).toLocaleString('zh-CN')
      ])
    ]

    // 使用简单的CSV格式导出
    const csvContent = [
      '员工姓名,月平均工资,缴费基数,公司应缴金额,计算时间',
      ...data.map(item => [
        item.employee_name,
        item.avg_salary,
        item.contribution_base,
        item.company_fee,
        new Date(item.created_at).toLocaleString('zh-CN')
      ].join(','))
    ].join('\n')

    // 创建Blob并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `社保计算结果_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchData()
  }, [])

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              计算结果查询
            </h1>
            <p className="text-gray-600">
              共找到 {data.length} 条计算记录
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={data.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出Excel
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {data.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                暂无计算结果
              </h3>
              <p className="text-gray-500 mb-4">
                请先上传数据并执行计算
              </p>
              <Button asChild>
                <a href="/upload">去上传数据</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        {data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>计算结果明细</CardTitle>
              <CardDescription>
                所有员工的社保公积金缴费计算结果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>员工姓名</TableHead>
                      <TableHead>月平均工资（元）</TableHead>
                      <TableHead>缴费基数（元）</TableHead>
                      <TableHead>公司应缴金额（元）</TableHead>
                      <TableHead>计算时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {row.employee_name}
                        </TableCell>
                        <TableCell>
                          {row.avg_salary.toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          {row.contribution_base.toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {row.company_fee.toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          {new Date(row.created_at).toLocaleString('zh-CN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {data.length}
                </div>
                <p className="text-sm text-gray-600">员工总数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  ¥{(data.reduce((sum, item) => sum + item.avg_salary, 0) / data.length).toLocaleString('zh-CN')}
                </div>
                <p className="text-sm text-gray-600">平均工资</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">
                  ¥{(data.reduce((sum, item) => sum + item.contribution_base, 0) / data.length).toLocaleString('zh-CN')}
                </div>
                <p className="text-sm text-gray-600">平均缴费基数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">
                  ¥{data.reduce((sum, item) => sum + item.company_fee, 0).toLocaleString('zh-CN')}
                </div>
                <p className="text-sm text-gray-600">公司总缴费</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}