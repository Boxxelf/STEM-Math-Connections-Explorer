#!/usr/bin/env python3
"""
修复graph_data.json中重复的rationales问题。

根据CSV文件，每个CS主题应该只与特定的微积分主题连接。
这个脚本会检查并移除所有不应该存在的连接。
"""

import json
import csv
from pathlib import Path
from collections import defaultdict

def parse_rationales_csv(filepath, category_name):
    """解析rationales CSV文件，返回 topic_code -> {cs_topic -> [rationales]} 的映射"""
    topic_rationales = defaultdict(lambda: defaultdict(list))
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            calc_topic = row.get('Calculus topic', '').strip()
            cs_topic = row.get('CS topic', '').strip()
            rationale = row.get('Rationale', '').strip()
            
            if calc_topic and cs_topic and rationale:
                # 我们需要通过topic name找到topic code
                # 这需要读取Calculus topic list CSV
                topic_rationales[calc_topic].append({
                    'cs_topic': cs_topic,
                    'rationale': rationale,
                    'category': category_name
                })
    
    return topic_rationales

def parse_calculus_csv(filepath):
    """解析Calculus topic list CSV，返回 topic_code -> topic_info 的映射"""
    topics = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            topic_code = row.get('Topic Code', '').strip()
            if topic_code:
                topics[topic_code] = {
                    'topicName': row.get('Topic Name', '').strip(),
                    'course': row.get('Course', '').strip(),
                    'coreIdea': row.get('Core Idea', '').strip()
                }
    return topics

def build_correct_connections():
    """根据CSV文件构建正确的连接映射：topic_code -> {category -> {cs_topic -> [rationales]}}"""
    base_path = Path(__file__).parent
    
    # 读取Calculus topic list
    calc_list_file = base_path / 'Calculus topic list-Table 1.csv'
    calculus_topics = parse_calculus_csv(calc_list_file)
    
    # 创建topic name到topic code的映射
    topic_name_to_code = {}
    for code, info in calculus_topics.items():
        topic_name_to_code[info['topicName']] = code
    
    # 读取所有rationales CSV文件
    csv_files = [
        (base_path / 'ML-Calc-Table 1.csv', 'Machine Learning'),
        (base_path / 'Alg-Calc-Table 1.csv', 'Algorithms'),
        (base_path / 'AI-Calc-Table 1.csv', 'Artificial Intelligence'),
        (base_path / 'CG-Calc-Table 1.csv', 'Computer Graphics')
    ]
    
    # 构建正确的连接映射：topic_code -> {category -> {cs_topic -> [rationales]}}
    correct_connections = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    
    for csv_file, category in csv_files:
        if not csv_file.exists():
            continue
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                calc_topic_name = row.get('Calculus topic', '').strip()
                cs_topic = row.get('CS topic', '').strip()
                rationale = row.get('Rationale', '').strip()
                
                if calc_topic_name and cs_topic and rationale:
                    # 通过topic name找到topic code
                    topic_code = topic_name_to_code.get(calc_topic_name)
                    if topic_code:
                        correct_connections[topic_code][category][cs_topic].append({
                            'cs_topic': cs_topic,
                            'rationale': rationale
                        })
    
    return correct_connections

def main():
    base_path = Path(__file__).parent
    graph_data_file = base_path / 'graph_data.json'
    
    print("构建正确的连接映射...")
    correct_connections = build_correct_connections()
    
    print(f"加载 graph_data.json...")
    with open(graph_data_file, 'r', encoding='utf-8') as f:
        graph = json.load(f)
    
    print(f"检查 {len(graph['nodes'])} 个节点...")
    
    fixed_count = 0
    for node in graph['nodes']:
        topic_code = node.get('topicCode')
        if not topic_code:
            continue
        
        # 获取该topic_code应该有的正确连接
        correct_rationales = correct_connections.get(topic_code, {})
        
        # 如果节点有rationales，检查并修复
        if node.get('rationales'):
            node_rationales = node['rationales']
            updated = False
            
            # 对于每个category
            for category in list(node_rationales.keys()):
                if category not in correct_rationales:
                    # 这个category不应该存在，删除它
                    del node_rationales[category]
                    updated = True
                    continue
                
                # 对于每个cs_topic
                correct_cs_topics = correct_rationales[category]
                items = node_rationales[category]
                
                # 只保留在correct_cs_topics中的rationales
                filtered_items = []
                for item in items:
                    cs_topic = item.get('cs_topic', '').strip()
                    if cs_topic in correct_cs_topics:
                        filtered_items.append(item)
                    else:
                        updated = True
                
                if len(filtered_items) == 0:
                    # 如果没有rationales了，删除这个category
                    del node_rationales[category]
                else:
                    node_rationales[category] = filtered_items
            
            # 如果rationales为空，删除它
            if not node_rationales:
                node['rationales'] = {}
                node['cs_categories'] = []
                updated = True
            else:
                # 更新cs_categories
                node['cs_categories'] = list(node_rationales.keys())
            
            if updated:
                fixed_count += 1
                print(f"  修复节点 {node.get('id')} (topicCode: {topic_code})")
        else:
            # 如果节点没有rationales，但应该有，添加它们
            if topic_code in correct_connections:
                node['rationales'] = {}
                for category, cs_topics in correct_connections[topic_code].items():
                    node['rationales'][category] = []
                    for cs_topic, rationales_list in cs_topics.items():
                        node['rationales'][category].extend(rationales_list)
                node['cs_categories'] = list(node['rationales'].keys())
                fixed_count += 1
                print(f"  添加节点 {node.get('id')} (topicCode: {topic_code}) 的rationales")
    
    print(f"\n修复了 {fixed_count} 个节点")
    
    # 写入更新后的graph_data.json
    print(f"\n写入 graph_data.json...")
    with open(graph_data_file, 'w', encoding='utf-8') as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)
    
    print("完成！")

if __name__ == '__main__':
    main()
