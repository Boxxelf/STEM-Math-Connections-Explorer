#!/usr/bin/env python3
"""
Data conversion script to generate graph_data.json from new CSV files.

This script:
1. Reads the new CSV files (ML-Calc, Alg-Calc, AI-Calc, CG-Calc)
2. Reads the Calculus topic list CSV
3. Reads the existing graph_data.json for structure
4. Updates node data with new topic names and rationales
5. Generates a new graph_data.json
"""

import json
import csv
import sys
from collections import defaultdict
from pathlib import Path

def normalize_text(text):
    """Normalize text for matching (similar to JavaScript version)"""
    import re
    if not text:
        return ''
    # Convert to lowercase
    normalized = text.lower()
    # Replace & with and
    normalized = normalized.replace('&', 'and')
    # Remove quotes
    normalized = normalized.replace("'", '').replace('`', '').replace("'", '')
    # Remove non-alphanumeric characters (except spaces)
    normalized = re.sub(r'[^a-z0-9\s]', ' ', normalized)
    # Replace multiple spaces with single space, then remove all spaces
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    # Remove all spaces (final step to match JS version)
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
    """Parse a rationales CSV file (ML-Calc, Alg-Calc, etc.)"""
    rationales = defaultdict(list)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            calc_topic = row.get('Calculus topic', '').strip()
            cs_topic = row.get('CS topic', '').strip()
            rationale = row.get('Rationale', '').strip()
            
            if calc_topic and cs_topic and rationale:
                # Normalize calculus topic name for matching
                normalized = normalize_text(calc_topic)
                rationales[normalized].append({
                    'cs_topic': cs_topic,
                    'rationale': rationale
                })
    
    return rationales

def load_existing_graph(filepath):
    """Load existing graph_data.json"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def match_calculus_topic(node_label, topic_lookup, calculus_topics):
    """Match a node label to a calculus topic"""
    # Try exact match first
    normalized_label = normalize_text(node_label)
    
    # Try to match by topic name
    for topic_code, topic_info in calculus_topics.items():
        normalized_topic = normalize_text(topic_info['topicName'])
        if normalized_label == normalized_topic:
            return topic_info
    
    # Try partial match - check if key words are present
    # Split into words (after normalization, there are no spaces, so we need a different approach)
    # Instead, check if the normalized strings share a significant substring
    label_len = len(normalized_label)
    if label_len > 10:  # Only do substring matching for longer strings
        for topic_code, topic_info in calculus_topics.items():
            normalized_topic = normalize_text(topic_info['topicName'])
            # Check if a significant portion of one is in the other
            if len(normalized_label) > 0 and len(normalized_topic) > 0:
                # Check if 70% of the shorter string is contained in the longer one
                shorter = normalized_label if len(normalized_label) < len(normalized_topic) else normalized_topic
                longer = normalized_topic if len(normalized_label) < len(normalized_topic) else normalized_label
                if len(shorter) * 0.7 <= len([c for c in shorter if c in longer]):
                    return topic_info
    
    # Manual mapping for known label mismatches (old label -> new topic code)
    manual_mappings = {
        'motivatingtheneedforcalculuslimits': 'Lim1',  # "Motivating the need for calculus & limits" -> "Introduction to calculus and limits"
    }
    
    if normalized_label in manual_mappings:
        topic_code = manual_mappings[normalized_label]
        if topic_code in calculus_topics:
            return calculus_topics[topic_code]
    
    return None

def update_graph_data(graph, calculus_topics, all_rationales):
    """Update graph data with new topic names and rationales"""
    # Build a map of normalized topic names to rationales
    topic_rationales_map = {}
    for category, rationales_dict in all_rationales.items():
        for normalized_topic, items in rationales_dict.items():
            if normalized_topic not in topic_rationales_map:
                topic_rationales_map[normalized_topic] = defaultdict(list)
            topic_rationales_map[normalized_topic][category].extend(items)
    
    # Also build a map by topic code for rationales (from CSV "Calculus topic" column)
    # The CSV uses the new topic names, so we need to match by topic code
    topic_code_rationales_map = {}
    for category, rationales_dict in all_rationales.items():
        # We need to match the normalized topic name from CSV to topic codes
        # This is a bit tricky - we'll match by trying to find the topic in calculus_topics
        for normalized_topic, items in rationales_dict.items():
            # Try to find matching topic code by matching normalized names
            for topic_code, topic_info in calculus_topics.items():
                normalized_topic_name = normalize_text(topic_info['topicName'])
                if normalized_topic == normalized_topic_name:
                    if topic_code not in topic_code_rationales_map:
                        topic_code_rationales_map[topic_code] = defaultdict(list)
                    topic_code_rationales_map[topic_code][category].extend(items)
                    break
    
    # Update nodes
    for node in graph['nodes']:
        node_label = node.get('label', '')
        
        # Try to match with calculus topics by label
        topic_info = match_calculus_topic(node_label, None, calculus_topics)
        if topic_info:
            node['topicCode'] = topic_info['topicCode']
            node['topicName'] = topic_info['topicName']
            node['course'] = topic_info['course']
            node['coreIdea'] = topic_info['coreIdea']
        
        # Try to get rationales - first by topic code, then by label matching
        topic_code = node.get('topicCode')
        if topic_code and topic_code in topic_code_rationales_map:
            # Use rationales matched by topic code
            node['rationales'] = dict(topic_code_rationales_map[topic_code])
        else:
            # Try to match by normalized label from new CSV topic names
            normalized_label = normalize_text(node_label)
            if normalized_label in topic_rationales_map:
                node['rationales'] = dict(topic_rationales_map[normalized_label])
            else:
                # Try to find matching topic in calculus_topics and use its topic code
                matched_topic = match_calculus_topic(node_label, None, calculus_topics)
                if matched_topic and matched_topic['topicCode'] in topic_code_rationales_map:
                    node['rationales'] = dict(topic_code_rationales_map[matched_topic['topicCode']])
                elif 'rationales' not in node:
                    # Keep existing rationales if no match found
                    node['rationales'] = node.get('rationales', {})
        
        # Update cs_categories based on rationales
        if node.get('rationales'):
            node['cs_categories'] = list(node['rationales'].keys())
    
    return graph

def main():
    base_path = Path(__file__).parent
    
    # File paths
    calc_list_file = base_path / 'Calculus topic list-Table 1.csv'
    ml_calc_file = base_path / 'ML-Calc-Table 1.csv'
    alg_calc_file = base_path / 'Alg-Calc-Table 1.csv'
    ai_calc_file = base_path / 'AI-Calc-Table 1.csv'
    cg_calc_file = base_path / 'CG-Calc-Table 1.csv'
    graph_data_file = base_path / 'graph_data.json'
    output_file = base_path / 'graph_data.json'
    
    print("Loading data...")
    
    # Load calculus topics
    print(f"Reading {calc_list_file}...")
    calculus_topics = parse_calculus_csv(calc_list_file)
    print(f"  Found {len(calculus_topics)} calculus topics")
    
    # Load rationales from each category
    all_rationales = {}
    
    if ml_calc_file.exists():
        print(f"Reading {ml_calc_file}...")
        ml_rationales = parse_rationales_csv(ml_calc_file, 'Machine Learning')
        all_rationales['Machine Learning'] = ml_rationales
        print(f"  Found rationales for {len(ml_rationales)} topics")
    
    if alg_calc_file.exists():
        print(f"Reading {alg_calc_file}...")
        alg_rationales = parse_rationales_csv(alg_calc_file, 'Algorithms')
        all_rationales['Algorithms'] = alg_rationales
        print(f"  Found rationales for {len(alg_rationales)} topics")
    
    if ai_calc_file.exists():
        print(f"Reading {ai_calc_file}...")
        ai_rationales = parse_rationales_csv(ai_calc_file, 'Artificial Intelligence')
        all_rationales['Artificial Intelligence'] = ai_rationales
        print(f"  Found rationales for {len(ai_rationales)} topics")
    
    if cg_calc_file.exists():
        print(f"Reading {cg_calc_file}...")
        cg_rationales = parse_rationales_csv(cg_calc_file, 'Computer Graphics')
        all_rationales['Computer Graphics'] = cg_rationales
        print(f"  Found rationales for {len(cg_rationales)} topics")
    
    # Load existing graph data
    print(f"Reading {graph_data_file}...")
    graph = load_existing_graph(graph_data_file)
    print(f"  Found {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")
    
    # Update graph data
    print("Updating graph data...")
    graph = update_graph_data(graph, calculus_topics, all_rationales)
    
    # Write output
    print(f"Writing {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)
    
    print("Done!")
    print(f"  Updated {len(graph['nodes'])} nodes")

if __name__ == '__main__':
    main()
