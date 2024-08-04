# Step 1: Parse the classes.txt file to create a mapping of class IDs to class names
class_id_to_name = {}
with open('nabirds/classes.txt', 'r') as f:
    for line in f:
        parts = line.strip().split(' ')
        class_id = parts[0]
        class_name = ' '.join(parts[1:])
        class_id_to_name[class_id] = class_name

# Step 2: Parse the hierarchy.txt file to get the child-parent relationships
relationships = []
with open('nabirds/hierarchy.txt', 'r') as f:
    for line in f:
        child_id, parent_id = line.strip().split()
        relationships.append((child_id, parent_id))

# Step 3: Replace IDs with class names in the relationships
new_relationships = []
for child_id, parent_id in relationships:
    child_name = class_id_to_name.get(child_id, f"UnknownID_{child_id}")
    parent_name = class_id_to_name.get(parent_id, f"UnknownID_{parent_id}")
    if child_name != parent_name:
      new_relationships.append((child_name, parent_name))

# Step 4: Write the new relationships to a new hierarchy.txt file
with open('hierarchy_names.txt', 'w') as f:
    for child_name, parent_name in new_relationships:
        f.write(f"{child_name}|{parent_name}\n")