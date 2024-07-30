from models import Species, db
import logging


def build_hierarchy_tree():
    species_dict = {}

    with open('seed/hierarchy_names.txt', 'r') as file:
        lines = file.readlines()
    for line in lines:
        species_name, parent_name = line.strip().split('|')
        species_dict[species_name] = parent_name

    # Step 1: Create a map to store child-parent relationships
    children_map = {}
    for child, parent in species_dict.items():
        if parent not in children_map:
            children_map[parent] = []
        children_map[parent].append(child)

    # Step 2: Define a recursive function to build the tree
    def build_tree_from_parent(parent):
        if parent not in children_map:
            return {}
        return {child: build_tree_from_parent(child) for child in children_map[parent]}

     # Find the root nodes (those which are parents but not children)
    root_nodes = set(species_dict.values()) - set(species_dict.keys())

    # Build the tree for each root node
    return {root: build_tree_from_parent(root) for root in root_nodes}


def dfs_traverse_and_insert(tree, parent_id=None):
    """
    Perform DFS traversal and insert records into the database.
    """
    for node_id, children in tree.items():
        # Create and insert the species record
        # Adjust name if necessary
        species = Species(name=node_id, parent_id=parent_id)
        db.session.add(species)
        db.session.flush()  # Flush to get the id without committing

        # Recursively insert children
        dfs_traverse_and_insert(children, species.id)


def seed():
    if not Species.query.first():
        logging.info('Seeding species hierarchy data...')
        tree = build_hierarchy_tree()
        dfs_traverse_and_insert(tree)
        db.session.commit()
        logging.info('Seeding complete...')
