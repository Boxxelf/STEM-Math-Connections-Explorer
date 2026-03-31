#!/usr/bin/env python3
"""
Fix all node topicCodes based on number_id and special mappings from app.js
Then sync all CSV associations
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

def get_special_topic_mapping(node_label, number_id):
    """Get special topic mapping based on app.js logic"""
    if not number_id:
        return None
    
    label_lower = (node_label or '').lower()
    
    # Handle special cases from app.js
    if number_id == 24:
        if 'sketching' in label_lower or 'graphing' in label_lower:
            return 'Der15'
        else:
            return 'Der11'
    
    if number_id == 19:
        if 'chain' in label_lower:
            return 'Der7'
        elif 'related' in label_lower:
            return 'Der10'
    
    if number_id == 26:
        if 'shape' in label_lower or 'concavity' in label_lower:
            return 'Der14'
        elif 'optimization' in label_lower:
            return 'Der17'
    
    if number_id == 22:
        if 'mean value' in label_lower:
            return 'Der13'
        elif 'inverse trigonometric' in label_lower:
            return 'Int13'
    
    if number_id == 29:
        if 'implicit' in label_lower:
            return 'Der8'
        elif 'integrals' in label_lower or 'area' in label_lower:
            return 'Int2'
    
    if number_id == 30:
        if 'newton' in label_lower:
            return 'Der18'
        elif 'definite' in label_lower:
            return 'Int3'
    
    # Direct mappings from app.js
    special_mappings = {
        1: 'Lim1',
        2: 'Lim2',
        3: 'Lim3',
        4: 'Lim4',
        6: 'Lim6',
        7: 'Lim5',
        8: 'Lim7',
        9: 'Der1',
        10: 'Der2',
        11: 'Der3',
        12: 'Der4',
        14: 'Der5',
        16: 'Der6',
        18: 'Der9',
        25: 'Der12',
        27: 'Der16',
        20: 'Int12',
        21: 'Int7',
        28: 'Int1',
        31: 'Int4',
        32: 'Int5',
        33: 'Int6',
        38: 'Int8',
        40: 'Int9',
        41: 'Int10',
        43: 'Int11',
        13: 'AdvInt1',
        48: 'AdvInt2',
        49: 'AdvInt3',
        50: 'AdvInt4',
        51: 'AdvInt5',
        52: 'AdvInt6',
        53: 'AdvInt7',
        54: 'AdvInt8',
        55: 'AdvInt9',
        56: 'AdvInt10',
        57: 'DiffEq1',
        58: 'DiffEq2',
        59: 'DiffEq3',
        60: 'DiffEq4',
        61: 'DiffEq5',
        5: 'SeqSer1',
        17: 'SeqSer7',
        63: 'SeqSer2',
        64: 'SeqSer3',
        65: 'SeqSer4',
        66: 'SeqSer5',
        67: 'SeqSer6',
        69: 'SeqSer8',
        15: 'ParamPol2',
        23: 'ParamPol1',
        72: 'ParamPol3',
        73: 'ParamPol4',
    }
    
    return special_mappings.get(number_id)

def main():
    base_path = Path(__file__).parent
    
    # File paths
    calc_list_file = base_path / 'Calculus topic list-Table 1.csv'
    ml_calc_file = base_path / 'ML-Calc-Table 1.csv'
    alg_calc_file = base_path / 'Alg-Calc-Table 1.csv'
    ai_calc_file = base_path / 'AI-Calc-Table 1.csv'
    cg_calc_file = base_path / 'CG-Calc-Table 1.csv'
    graph_data_file = base_path / 'graph_data.json'
    
    print("加载数据...")
    
    # Load calculus topics
    calculus_topics = parse_calculus_csv(calc_list_file)
    print(f"找到 {len(calculus_topics)} 个微积分主题")
    
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
    
    for csv_file, category in csv_files:
        if csv_file.exists():
            rationales = parse_rationales_csv(csv_file, category)
            all_csv_rationales.extend(rationales)
    
    print(f"从 CSV 文件读取了 {len(all_csv_rationales)} 个关联")
    
    # Build a map: topic_code -> {category -> [rationales]}
    topic_rationales_map = defaultdict(lambda: defaultdict(list))
    
    for csv_item in all_csv_rationales:
        calc_topic = csv_item['calc_topic']
        normalized_calc = normalize_text(calc_topic)
        topic_code = topic_name_to_code.get(normalized_calc)
        
        if topic_code:
            category = csv_item['category']
            topic_rationales_map[topic_code][category].append({
                'cs_topic': csv_item['cs_topic'],
                'rationale': csv_item['rationale']
            })
    
    print(f"构建了 {len(topic_rationales_map)} 个主题的关联映射")
    
    # Load graph_data.json
    with open(graph_data_file, 'r', encoding='utf-8') as f:
        graph = json.load(f)
    
    print(f"加载 graph_data.json: {len(graph['nodes'])} 个节点")
    
    # Fix all node topicCodes
    fixed_count = 0
    for node in graph['nodes']:
        number_id = node.get('number_id')
        if number_id is None:
            continue
        
        # Get correct topic code
        correct_topic_code = get_special_topic_mapping(node.get('label', ''), number_id)
        
        if correct_topic_code and correct_topic_code in calculus_topics:
            old_topic_code = node.get('topicCode')
            if old_topic_code != correct_topic_code:
                print(f"  修复节点 {node.get('id')} (number_id: {number_id}): {old_topic_code} -> {correct_topic_code}")
                fixed_count += 1
            
            node['topicCode'] = correct_topic_code
            topic_info = calculus_topics[correct_topic_code]
            node['topicName'] = topic_info['topicName']
            node['course'] = topic_info['course']
            node['coreIdea'] = topic_info['coreIdea']
    
    print(f"\n修复了 {fixed_count} 个节点的 topicCode")
    
    # Now update all nodes with rationales
    updated_count = 0
    for node in graph['nodes']:
        topic_code = node.get('topicCode')
        if not topic_code:
            continue
        
        if topic_code in topic_rationales_map:
            # Replace rationales completely (not merge)
            node['rationales'] = dict(topic_rationales_map[topic_code])
            node['cs_categories'] = list(node['rationales'].keys())
            updated_count += 1
    
    print(f"更新了 {updated_count} 个节点的关联")
    
    # Write updated graph_data.json
    print(f"\n写入 graph_data.json...")
    with open(graph_data_file, 'w', encoding='utf-8') as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)
    
    print("完成！")

if __name__ == '__main__':
    main()
