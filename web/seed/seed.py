from models import Species, db
import logging
from util import build_hierarchy_tree


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
