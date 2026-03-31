#!/usr/bin/env python3
"""
Verify that all CSV associations are correctly synced to graph_data.json
"""

import json
import csv
from pathlib import Path
from collections import defaultdict

def normalize_text(text):
    """Normalize text for matching"""
    import re
    if not text:
        return ''
    normalized = text.lower()
    normalized = normalized.replace('&', 'and')
    normalized = normalized.replace("'", '').replace('`', '').replace("'", '')
    normalized = re.sub(r'[^a-z0-9\s]', ' ', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    normalized = normalized.replace(' ', '')
    return normalized

def parse_calculus_csv(filepath):
    """Parse Calculus topic list CSV"""
    topics = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            topic_code = row.get('Topic Code', '').strip()
            if topic_code:
                topics[topic_code] = {
                    'course': row.get('Course', '').strip(),
                    'coreIdea': row.get('Core Idea', '').strip(),
                    'topicCode': topic_code,
                    'topicName': row.get('Topic Name', '').strip()
                }
    return topics

def parse_rationales_csv(filepath, category_name):
    """Parse a rationales CSV file"""
    rationales = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            calc_topic = row.get('Calculus topic', '').strip()
            cs_topic = row.get('CS topic', '').strip()
            rationale = row.get('Rationale', '').strip()
            
            if calc_topic and cs_topic and rationale:
                rationales.append({
                    'calc_topic': calc_topic,
                    'cs_topic': cs_topic,
                    'rationale': rationale,
                    'category': category_name
                })
    return rationales

def main():
    base_path = Path(__file__).parent
    
    # File paths
    calc_list_file = base_path / 'Calculus topic list-Table 1.csv'
    ml_calc_file = base_path / 'ML-Calc-Table 1.csv'
    alg_calc_file = base_path / 'Alg-Calc-Table 1.csv'
    ai_calc_file = base_path / 'AI-Calc-Table 1.csv'
    cg_calc_file = base_path / 'CG-Calc-Table 1.csv'
    graph_data_file = base_path / 'graph_data.json'
    
    print("=" * 80)
    print("验证 CSV 文件与 graph_data.json 的同步情况")
    print("=" * 80)
    
    # Load calculus topics
    calculus_topics = parse_calculus_csv(calc_list_file)
    
    # Build a map from topic name to topic code
    topic_name_to_code = {}
    for code, info in calculus_topics.items():
        normalized_name = normalize_text(info['topicName'])
        topic_name_to_code[normalized_name] = code
    
    # Load all rationales from CSV files
    all_csv_rationales = []
    
    csv_files = [
        (ml_calc_file, 'Machine Learning'),
        (alg_calc_file, 'Algorithms'),
        (ai_calc_file, 'Artificial Intelligence'),
        (cg_calc_file, 'Computer Graphics')
    ]
    
    print("\n从 CSV 文件读取关联:")
    for csv_file, category in csv_files:
        if csv_file.exists():
            rationales = parse_rationales_csv(csv_file, category)
            all_csv_rationales.extend(rationales)
            print(f"  {category}: {len(rationales)} 个关联")
    
    print(f"\nCSV 文件总计: {len(all_csv_rationales)} 个关联")
    
    # Load graph_data.json
    with open(graph_data_file, 'r', encoding='utf-8') as f:
        graph = json.load(f)
    
    # Build a map of what's in graph_data.json
    # Key: (topicCode, category, cs_topic) -> rationale
    graph_rationales = {}
    for node in graph['nodes']:
        topic_code = node.get('topicCode')
        if not topic_code:
            continue
        
        rationales = node.get('rationales', {})
        for category, items in rationales.items():
            for item in items:
                cs_topic = item.get('cs_topic', '').strip()
                if cs_topic:
                    key = (topic_code, category, cs_topic)
                    graph_rationales[key] = item.get('rationale', '')
    
    print(f"graph_data.json 总计: {len(graph_rationales)} 个关联")
    
    # Check for missing associations
    missing = []
    found = []
    not_found_topic = []
    
    for csv_item in all_csv_rationales:
        calc_topic = csv_item['calc_topic']
        cs_topic = csv_item['cs_topic']
        category = csv_item['category']
        
        # Find topic code
        normalized_calc = normalize_text(calc_topic)
        topic_code = topic_name_to_code.get(normalized_calc)
        
        if not topic_code:
            not_found_topic.append({
                'calc_topic': calc_topic,
                'category': category,
                'cs_topic': cs_topic
            })
            continue
        
        key = (topic_code, category, cs_topic)
        if key not in graph_rationales:
            missing.append({
                'topic_code': topic_code,
                'calc_topic': calc_topic,
                'category': category,
                'cs_topic': cs_topic
            })
        else:
            found.append(key)
    
    print(f"\n同步状态:")
    print(f"  ✓ 已同步: {len(found)} 个关联")
    print(f"  ✗ 缺失: {len(missing)} 个关联")
    if not_found_topic:
        print(f"  ⚠ 无法找到主题代码: {len(not_found_topic)} 个关联")
    
    if missing:
        print(f"\n缺失的关联 (前20个):")
        for i, item in enumerate(missing[:20], 1):
            print(f"  {i}. {item['topic_code']} ({item['calc_topic']}) -> {item['category']} / {item['cs_topic']}")
        if len(missing) > 20:
            print(f"  ... 还有 {len(missing) - 20} 个")
    
    if not_found_topic:
        print(f"\n无法找到主题代码的关联:")
        for item in not_found_topic:
            print(f"  - {item['calc_topic']} -> {item['category']} / {item['cs_topic']}")
    
    # Check Image composition specifically
    print(f"\n检查 Image composition 关联:")
    image_comp_found = False
    for key, rationale in graph_rationales.items():
        topic_code, category, cs_topic = key
        if cs_topic.lower() == 'image composition' and category == 'Computer Graphics':
            print(f"  ✓ 找到: {topic_code} ({calculus_topics.get(topic_code, {}).get('topicName', 'Unknown')}) -> Computer Graphics / Image composition")
            image_comp_found = True
            break
    
    if not image_comp_found:
        print(f"  ✗ 未找到 Image composition 关联")
    
    print("\n" + "=" * 80)
    if len(missing) == 0 and len(not_found_topic) == 0:
        print("✓ 所有关联都已正确同步！")
    else:
        print(f"⚠ 还有 {len(missing) + len(not_found_topic)} 个关联需要修复")
    print("=" * 80)

if __name__ == '__main__':
    main()
